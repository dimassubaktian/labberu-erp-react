<?php

use App\Models\Invoice;
use App\Models\User;

test('payment can be cancelled with a reason, reverting the payment status', function () {
    $user = User::factory()->create();
    $invoice = Invoice::factory()->create(['status' => 'issued', 'total' => 1_000_000]);
    $payment = $invoice->payments()->create([
        'amount' => 1_000_000,
        'payment_date' => now()->toDateString(),
        'recorded_by' => $user->id,
    ]);
    $invoice->update(['payment_status' => 'paid']);

    $response = $this->actingAs($user)->patch(
        route('invoices.payments.cancel', [$invoice, $payment]),
        ['cancel_reason' => 'Payment reversed by bank.'],
    );

    $response->assertSessionHasNoErrors();
    $payment->refresh();
    expect($payment->cancelled_at)->not->toBeNull();
    expect($payment->cancel_reason)->toBe('Payment reversed by bank.');
    expect($payment->cancelled_by)->toBe($user->id);
    expect($invoice->refresh()->payment_status)->toBeNull();
});

test('cancelling a payment without a reason fails validation', function () {
    $user = User::factory()->create();
    $invoice = Invoice::factory()->create(['status' => 'issued', 'total' => 1_000_000]);
    $payment = $invoice->payments()->create([
        'amount' => 1_000_000,
        'payment_date' => now()->toDateString(),
        'recorded_by' => $user->id,
    ]);

    $this->actingAs($user)
        ->patch(route('invoices.payments.cancel', [$invoice, $payment]), [])
        ->assertSessionHasErrors(['cancel_reason']);

    expect($payment->refresh()->cancelled_at)->toBeNull();
});

test('payment status moves back to partially_paid when one of two payments is cancelled', function () {
    $user = User::factory()->create();
    $invoice = Invoice::factory()->create(['status' => 'issued', 'total' => 1_000_000]);
    $paymentOne = $invoice->payments()->create([
        'amount' => 600_000,
        'payment_date' => now()->toDateString(),
        'recorded_by' => $user->id,
    ]);
    $invoice->payments()->create([
        'amount' => 400_000,
        'payment_date' => now()->toDateString(),
        'recorded_by' => $user->id,
    ]);
    $invoice->update(['payment_status' => 'paid']);

    $this->actingAs($user)
        ->patch(route('invoices.payments.cancel', [$invoice, $paymentOne]), ['cancel_reason' => 'Duplicate entry.'])
        ->assertSessionHasNoErrors();

    expect($invoice->refresh()->payment_status)->toBe('partially_paid');
});

test('a payment cannot be cancelled from a different invoice', function () {
    $user = User::factory()->create();
    $invoice = Invoice::factory()->create(['status' => 'issued']);
    $otherInvoice = Invoice::factory()->create(['status' => 'issued']);
    $payment = $otherInvoice->payments()->create([
        'amount' => 100_000,
        'payment_date' => now()->toDateString(),
        'recorded_by' => $user->id,
    ]);

    $this->actingAs($user)
        ->patch(route('invoices.payments.cancel', [$invoice, $payment]), ['cancel_reason' => 'Mistake.'])
        ->assertNotFound();
});

test('an already cancelled payment cannot be cancelled again', function () {
    $user = User::factory()->create();
    $invoice = Invoice::factory()->create(['status' => 'issued']);
    $payment = $invoice->payments()->create([
        'amount' => 100_000,
        'payment_date' => now()->toDateString(),
        'recorded_by' => $user->id,
        'cancelled_at' => now(),
        'cancel_reason' => 'Already cancelled.',
        'cancelled_by' => $user->id,
    ]);

    $this->actingAs($user)
        ->patch(route('invoices.payments.cancel', [$invoice, $payment]), ['cancel_reason' => 'Try again.'])
        ->assertForbidden();
});

test('guests cannot cancel payments', function () {
    $invoice = Invoice::factory()->create(['status' => 'issued']);
    $payment = $invoice->payments()->create([
        'amount' => 100_000,
        'payment_date' => now()->toDateString(),
        'recorded_by' => User::factory()->create()->id,
    ]);

    $this->patch(route('invoices.payments.cancel', [$invoice, $payment]), ['cancel_reason' => 'Test.'])
        ->assertRedirect(route('login'));
});
