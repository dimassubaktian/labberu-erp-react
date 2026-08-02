<?php

use App\Models\Invoice;
use App\Models\InvoicePayment;
use App\Models\User;

test('payment can be removed, reverting the payment status', function () {
    $user = User::factory()->create();
    $invoice = Invoice::factory()->create(['status' => 'issued', 'total' => 1_000_000]);
    $payment = $invoice->payments()->create([
        'amount' => 1_000_000,
        'payment_date' => now()->toDateString(),
        'recorded_by' => $user->id,
    ]);
    $invoice->update(['payment_status' => 'paid']);

    $response = $this->actingAs($user)->delete(route('invoices.payments.destroy', [$invoice, $payment]));

    $response->assertSessionHasNoErrors();
    expect(InvoicePayment::find($payment->id))->toBeNull();
    expect($invoice->refresh()->payment_status)->toBeNull();
});

test('payment status moves back to partially_paid when one of two payments is deleted', function () {
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
        ->delete(route('invoices.payments.destroy', [$invoice, $paymentOne]))
        ->assertSessionHasNoErrors();

    expect($invoice->refresh()->payment_status)->toBe('partially_paid');
});

test('a payment cannot be removed from a different invoice', function () {
    $user = User::factory()->create();
    $invoice = Invoice::factory()->create(['status' => 'issued']);
    $otherInvoice = Invoice::factory()->create(['status' => 'issued']);
    $payment = $otherInvoice->payments()->create([
        'amount' => 100_000,
        'payment_date' => now()->toDateString(),
        'recorded_by' => $user->id,
    ]);

    $this->actingAs($user)
        ->delete(route('invoices.payments.destroy', [$invoice, $payment]))
        ->assertNotFound();
});

test('guests cannot remove payments', function () {
    $invoice = Invoice::factory()->create(['status' => 'issued']);
    $payment = $invoice->payments()->create([
        'amount' => 100_000,
        'payment_date' => now()->toDateString(),
        'recorded_by' => User::factory()->create()->id,
    ]);

    $this->delete(route('invoices.payments.destroy', [$invoice, $payment]))
        ->assertRedirect(route('login'));
});
