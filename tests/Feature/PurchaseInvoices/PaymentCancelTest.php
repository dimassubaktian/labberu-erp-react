<?php

use App\Models\PurchaseInvoice;
use App\Models\PurchaseOrder;
use App\Models\User;

test('payment can be cancelled with a reason, reverting the payment status', function () {
    $user = User::factory()->create();
    $purchaseInvoice = PurchaseInvoice::factory()->create(['status' => 'issued', 'total' => 1_000_000]);
    $payment = $purchaseInvoice->payments()->create([
        'amount' => 1_000_000,
        'payment_date' => now()->toDateString(),
        'recorded_by' => $user->id,
    ]);
    $purchaseInvoice->update(['payment_status' => 'paid']);

    $response = $this->actingAs($user)->patch(
        route('purchase-invoices.payments.cancel', [$purchaseInvoice, $payment]),
        ['cancel_reason' => 'Payment reversed by bank.'],
    );

    $response->assertSessionHasNoErrors();
    $payment->refresh();
    expect($payment->cancelled_at)->not->toBeNull();
    expect($payment->cancel_reason)->toBe('Payment reversed by bank.');
    expect($payment->cancelled_by)->toBe($user->id);
    expect($purchaseInvoice->refresh()->payment_status)->toBeNull();
});

test('cancelling a payment also reverts the purchase order\'s payment status', function () {
    $user = User::factory()->create();
    $purchaseOrder = PurchaseOrder::factory()->create(['grand_total' => 1_000_000]);
    $purchaseInvoice = PurchaseInvoice::factory()->create([
        'purchase_order_id' => $purchaseOrder->id,
        'status' => 'issued',
        'total' => 1_000_000,
    ]);
    $payment = $purchaseInvoice->payments()->create([
        'amount' => 1_000_000,
        'payment_date' => now()->toDateString(),
        'recorded_by' => $user->id,
    ]);
    $purchaseInvoice->update(['payment_status' => 'paid']);
    $purchaseOrder->update(['payment_status' => 'paid']);

    $this->actingAs($user)->patch(
        route('purchase-invoices.payments.cancel', [$purchaseInvoice, $payment]),
        ['cancel_reason' => 'Payment reversed by bank.'],
    )->assertSessionHasNoErrors();

    expect($purchaseOrder->refresh()->payment_status)->toBeNull();
});

test('cancelling a payment without a reason fails validation', function () {
    $user = User::factory()->create();
    $purchaseInvoice = PurchaseInvoice::factory()->create(['status' => 'issued', 'total' => 1_000_000]);
    $payment = $purchaseInvoice->payments()->create([
        'amount' => 1_000_000,
        'payment_date' => now()->toDateString(),
        'recorded_by' => $user->id,
    ]);

    $this->actingAs($user)
        ->patch(route('purchase-invoices.payments.cancel', [$purchaseInvoice, $payment]), [])
        ->assertSessionHasErrors(['cancel_reason']);

    expect($payment->refresh()->cancelled_at)->toBeNull();
});

test('payment status moves back to partially_paid when one of two payments is cancelled', function () {
    $user = User::factory()->create();
    $purchaseInvoice = PurchaseInvoice::factory()->create(['status' => 'issued', 'total' => 1_000_000]);
    $paymentOne = $purchaseInvoice->payments()->create([
        'amount' => 600_000,
        'payment_date' => now()->toDateString(),
        'recorded_by' => $user->id,
    ]);
    $purchaseInvoice->payments()->create([
        'amount' => 400_000,
        'payment_date' => now()->toDateString(),
        'recorded_by' => $user->id,
    ]);
    $purchaseInvoice->update(['payment_status' => 'paid']);

    $this->actingAs($user)
        ->patch(route('purchase-invoices.payments.cancel', [$purchaseInvoice, $paymentOne]), ['cancel_reason' => 'Duplicate entry.'])
        ->assertSessionHasNoErrors();

    expect($purchaseInvoice->refresh()->payment_status)->toBe('partially_paid');
});

test('a payment cannot be cancelled from a different purchase invoice', function () {
    $user = User::factory()->create();
    $purchaseInvoice = PurchaseInvoice::factory()->create(['status' => 'issued']);
    $otherPurchaseInvoice = PurchaseInvoice::factory()->create(['status' => 'issued']);
    $payment = $otherPurchaseInvoice->payments()->create([
        'amount' => 100_000,
        'payment_date' => now()->toDateString(),
        'recorded_by' => $user->id,
    ]);

    $this->actingAs($user)
        ->patch(route('purchase-invoices.payments.cancel', [$purchaseInvoice, $payment]), ['cancel_reason' => 'Mistake.'])
        ->assertNotFound();
});

test('an already cancelled payment cannot be cancelled again', function () {
    $user = User::factory()->create();
    $purchaseInvoice = PurchaseInvoice::factory()->create(['status' => 'issued']);
    $payment = $purchaseInvoice->payments()->create([
        'amount' => 100_000,
        'payment_date' => now()->toDateString(),
        'recorded_by' => $user->id,
        'cancelled_at' => now(),
        'cancel_reason' => 'Already cancelled.',
        'cancelled_by' => $user->id,
    ]);

    $this->actingAs($user)
        ->patch(route('purchase-invoices.payments.cancel', [$purchaseInvoice, $payment]), ['cancel_reason' => 'Try again.'])
        ->assertForbidden();
});

test('guests cannot cancel payments', function () {
    $purchaseInvoice = PurchaseInvoice::factory()->create(['status' => 'issued']);
    $payment = $purchaseInvoice->payments()->create([
        'amount' => 100_000,
        'payment_date' => now()->toDateString(),
        'recorded_by' => User::factory()->create()->id,
    ]);

    $this->patch(route('purchase-invoices.payments.cancel', [$purchaseInvoice, $payment]), ['cancel_reason' => 'Test.'])
        ->assertRedirect(route('login'));
});
