<?php

namespace App\Http\Controllers;

use App\Http\Requests\InvoicePaymentCancelRequest;
use App\Http\Requests\InvoicePaymentStoreRequest;
use App\Models\ActivityLog;
use App\Models\Invoice;
use App\Models\InvoicePayment;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;
use Symfony\Component\HttpFoundation\StreamedResponse;

class InvoicePaymentController extends Controller
{
    /**
     * Record a new payment against the specified invoice.
     */
    public function store(InvoicePaymentStoreRequest $request, Invoice $invoice): RedirectResponse
    {
        $data = $request->validated();

        DB::transaction(function () use ($data, $invoice, $request): void {
            $proofPath = $request->hasFile('proof_of_payment')
                ? $request->file('proof_of_payment')->store('invoice-payment-proofs', 'local')
                : null;

            $payment = $invoice->payments()->create([
                'amount' => $data['amount'],
                'payment_date' => $data['payment_date'],
                'method' => $data['method'] ?? null,
                'remarks' => $data['remarks'] ?? null,
                'proof_of_payment_path' => $proofPath,
                'recorded_by' => $request->user()->id,
            ]);

            $this->recomputePaymentStatus($invoice);
            $invoice->quotation->project->recomputeBillingStatus();
            $invoice->quotation->project->recomputeStatus();

            ActivityLog::record('invoice.payment.recorded', $invoice, "Recorded a payment of {$payment->amount} against invoice {$invoice->invoice_code}.");
        });

        Inertia::flash('toast', ['type' => 'success', 'message' => __('Payment recorded.')]);

        return to_route('invoices.show', $invoice);
    }

    /**
     * Download the proof of payment attached to the specified payment.
     */
    public function downloadProof(Invoice $invoice, InvoicePayment $payment): StreamedResponse
    {
        abort_if($payment->invoice_id !== $invoice->id, 404);
        abort_if($payment->proof_of_payment_path === null, 404);

        return Storage::disk('local')->download($payment->proof_of_payment_path);
    }

    /**
     * Cancel the specified payment against the specified invoice.
     */
    public function cancel(InvoicePaymentCancelRequest $request, Invoice $invoice, InvoicePayment $payment): RedirectResponse
    {
        abort_if($payment->invoice_id !== $invoice->id, 404);

        DB::transaction(function () use ($request, $invoice, $payment): void {
            $payment->update([
                'cancelled_at' => now(),
                'cancel_reason' => $request->validated('cancel_reason'),
                'cancelled_by' => $request->user()->id,
            ]);

            $this->recomputePaymentStatus($invoice);
            $invoice->quotation->project->recomputeBillingStatus();
            $invoice->quotation->project->recomputeStatus();

            ActivityLog::record('invoice.payment.cancelled', $invoice, "Cancelled a payment of {$payment->amount} against invoice {$invoice->invoice_code}.");
        });

        Inertia::flash('toast', ['type' => 'success', 'message' => __('Payment cancelled.')]);

        return to_route('invoices.show', $invoice);
    }

    /**
     * Recompute and persist the invoice's payment status from the sum of its active
     * (non-cancelled) payments against its total.
     */
    private function recomputePaymentStatus(Invoice $invoice): void
    {
        $totalPaid = (float) $invoice->payments()->whereNull('cancelled_at')->sum('amount');

        $paymentStatus = match (true) {
            $totalPaid <= 0 => null,
            $totalPaid >= (float) $invoice->total => 'paid',
            default => 'partially_paid',
        };

        $invoice->update(['payment_status' => $paymentStatus]);
    }
}
