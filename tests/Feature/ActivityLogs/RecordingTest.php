<?php

use App\Models\ActivityLog;
use App\Models\Invoice;
use App\Models\PurchaseOrder;
use App\Models\Quotation;
use App\Models\User;
use App\Models\Workforce;

test('issuing an invoice records an activity log entry', function () {
    $user = User::factory()->create();
    $invoice = Invoice::factory()->create(['status' => 'draft']);

    $this->actingAs($user)->patch(route('invoices.issue', $invoice))->assertSessionHasNoErrors();

    $log = ActivityLog::query()->where('action', 'invoice.issued')->sole();
    expect($log->causer_id)->toBe($user->id);
    expect($log->subject_type)->toBe($invoice->getMorphClass());
    expect($log->subject_id)->toBe($invoice->id);
});

test('recording and cancelling an invoice payment records activity log entries', function () {
    $user = User::factory()->create();
    $invoice = Invoice::factory()->create(['status' => 'issued', 'total' => 1_000_000]);

    $this->actingAs($user)->post(route('invoices.payments.store', $invoice), [
        'amount' => 400_000,
        'payment_date' => now()->toDateString(),
    ])->assertSessionHasNoErrors();

    expect(ActivityLog::query()->where('action', 'invoice.payment.recorded')->exists())->toBeTrue();

    $payment = $invoice->payments()->sole();

    $this->actingAs($user)->patch(route('invoices.payments.cancel', [$invoice, $payment]), [
        'cancel_reason' => 'Duplicate entry.',
    ])->assertSessionHasNoErrors();

    expect(ActivityLog::query()->where('action', 'invoice.payment.cancelled')->exists())->toBeTrue();
});

test('approving a purchase order records an activity log entry', function () {
    $user = User::factory()->create();
    Workforce::factory()->create(['user_id' => $user->id]);
    $purchaseOrder = PurchaseOrder::factory()->create([
        'status' => 'issued',
        'checked_by_1_id' => Workforce::factory()->create()->id,
        'checked_by_1_at' => now(),
        'checked_by_2_id' => Workforce::factory()->create()->id,
        'checked_by_2_at' => now(),
    ]);

    $this->actingAs($user)
        ->patch(route('purchase-orders.approve', $purchaseOrder))
        ->assertSessionHasNoErrors();

    expect(ActivityLog::query()->where('action', 'purchase_order.approved')->exists())->toBeTrue();
});

test('approving and rejecting a quotation records an activity log entry', function () {
    $user = User::factory()->create();
    $quotation = Quotation::factory()->create(['status' => 'request_for_approval']);

    $this->actingAs($user)->patch(route('quotations.status.update', $quotation), [
        'status' => 'approved',
    ])->assertSessionHasNoErrors();

    expect(ActivityLog::query()->where('action', 'quotation.approved')->exists())->toBeTrue();

    $rejected = Quotation::factory()->create(['status' => 'request_for_approval']);

    $this->actingAs($user)->patch(route('quotations.status.update', $rejected), [
        'status' => 'rejected',
    ])->assertSessionHasNoErrors();

    expect(ActivityLog::query()->where('action', 'quotation.rejected')->exists())->toBeTrue();
});
