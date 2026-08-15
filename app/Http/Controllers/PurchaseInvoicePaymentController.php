<?php

namespace App\Http\Controllers;

use App\Http\Requests\PurchaseInvoicePaymentCancelRequest;
use App\Http\Requests\PurchaseInvoicePaymentStoreRequest;
use App\Models\PurchaseInvoice;
use App\Models\PurchaseInvoicePayment;
use App\Models\PurchaseOrder;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;

class PurchaseInvoicePaymentController extends Controller
{
    /**
     * Record a new payment against the specified purchase invoice.
     */
    public function store(PurchaseInvoicePaymentStoreRequest $request, PurchaseInvoice $purchaseInvoice): RedirectResponse
    {
        $data = $request->validated();

        DB::transaction(function () use ($data, $purchaseInvoice, $request): void {
            $purchaseInvoice->payments()->create([
                'amount' => $data['amount'],
                'payment_date' => $data['payment_date'],
                'method' => $data['method'] ?? null,
                'remarks' => $data['remarks'] ?? null,
                'recorded_by' => $request->user()->id,
            ]);

            $this->recomputePaymentStatus($purchaseInvoice);
            $this->recomputePurchaseOrderPaymentStatus($purchaseInvoice->purchaseOrder);
        });

        Inertia::flash('toast', ['type' => 'success', 'message' => __('Payment recorded.')]);

        return to_route('purchase-invoices.show', $purchaseInvoice);
    }

    /**
     * Cancel the specified payment against the specified purchase invoice.
     */
    public function cancel(PurchaseInvoicePaymentCancelRequest $request, PurchaseInvoice $purchaseInvoice, PurchaseInvoicePayment $payment): RedirectResponse
    {
        abort_if($payment->purchase_invoice_id !== $purchaseInvoice->id, 404);

        DB::transaction(function () use ($request, $purchaseInvoice, $payment): void {
            $payment->update([
                'cancelled_at' => now(),
                'cancel_reason' => $request->validated('cancel_reason'),
                'cancelled_by' => $request->user()->id,
            ]);

            $this->recomputePaymentStatus($purchaseInvoice);
            $this->recomputePurchaseOrderPaymentStatus($purchaseInvoice->purchaseOrder);
        });

        Inertia::flash('toast', ['type' => 'success', 'message' => __('Payment cancelled.')]);

        return to_route('purchase-invoices.show', $purchaseInvoice);
    }

    /**
     * Recompute and persist the purchase invoice's payment status from the sum of its active
     * (non-cancelled) payments against its total.
     */
    private function recomputePaymentStatus(PurchaseInvoice $purchaseInvoice): void
    {
        $totalPaid = (float) $purchaseInvoice->payments()->whereNull('cancelled_at')->sum('amount');

        $paymentStatus = match (true) {
            $totalPaid <= 0 => null,
            $totalPaid >= (float) $purchaseInvoice->total => 'paid',
            default => 'partially_paid',
        };

        $purchaseInvoice->update(['payment_status' => $paymentStatus]);
    }

    /**
     * Recompute and persist the purchase order's payment status from the sum of active
     * (non-cancelled) payments across all its purchase invoices against its grand total.
     */
    private function recomputePurchaseOrderPaymentStatus(PurchaseOrder $purchaseOrder): void
    {
        $totalPaid = (float) PurchaseInvoicePayment::query()
            ->whereHas('purchaseInvoice', fn ($query) => $query->where('purchase_order_id', $purchaseOrder->id))
            ->whereNull('cancelled_at')
            ->sum('amount');

        $paymentStatus = match (true) {
            $totalPaid <= 0 => null,
            $totalPaid >= (float) $purchaseOrder->grand_total => 'paid',
            default => 'partially_paid',
        };

        $purchaseOrder->update(['payment_status' => $paymentStatus]);
    }
}
