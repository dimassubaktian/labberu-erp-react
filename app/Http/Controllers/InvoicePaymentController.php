<?php

namespace App\Http\Controllers;

use App\Http\Requests\InvoicePaymentStoreRequest;
use App\Models\Invoice;
use App\Models\InvoicePayment;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;

class InvoicePaymentController extends Controller
{
    /**
     * Record a new payment against the specified invoice.
     */
    public function store(InvoicePaymentStoreRequest $request, Invoice $invoice): RedirectResponse
    {
        $data = $request->validated();

        DB::transaction(function () use ($data, $invoice, $request): void {
            $invoice->payments()->create([
                'amount' => $data['amount'],
                'payment_date' => $data['payment_date'],
                'method' => $data['method'] ?? null,
                'remarks' => $data['remarks'] ?? null,
                'recorded_by' => $request->user()->id,
            ]);

            $this->recomputePaymentStatus($invoice);
        });

        Inertia::flash('toast', ['type' => 'success', 'message' => __('Payment recorded.')]);

        return to_route('invoices.show', $invoice);
    }

    /**
     * Remove the specified payment from the specified invoice.
     */
    public function destroy(Invoice $invoice, InvoicePayment $payment): RedirectResponse
    {
        abort_if($payment->invoice_id !== $invoice->id, 404);

        DB::transaction(function () use ($invoice, $payment): void {
            $payment->delete();

            $this->recomputePaymentStatus($invoice);
        });

        Inertia::flash('toast', ['type' => 'success', 'message' => __('Payment removed.')]);

        return to_route('invoices.show', $invoice);
    }

    /**
     * Recompute and persist the invoice's payment status from the sum of its payments
     * against its total.
     */
    private function recomputePaymentStatus(Invoice $invoice): void
    {
        $totalPaid = (float) $invoice->payments()->sum('amount');

        $paymentStatus = match (true) {
            $totalPaid <= 0 => null,
            $totalPaid >= (float) $invoice->total => 'paid',
            default => 'partially_paid',
        };

        $invoice->update(['payment_status' => $paymentStatus]);
    }
}
