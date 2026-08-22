<?php

use App\Models\Invoice;
use App\Models\User;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;

beforeEach(function () {
    Storage::fake('local');
});

test('payment can be recorded with a proof of payment file', function () {
    $user = User::factory()->create();
    $invoice = Invoice::factory()->create(['status' => 'issued', 'total' => 1_000_000]);

    $response = $this->actingAs($user)->post(route('invoices.payments.store', $invoice), [
        'amount' => 400_000,
        'payment_date' => now()->toDateString(),
        'proof_of_payment' => UploadedFile::fake()->create('proof.pdf', 100, 'application/pdf'),
    ]);

    $response->assertSessionHasNoErrors();

    $payment = $invoice->payments()->sole();
    expect($payment->proof_of_payment_path)->not->toBeNull();
    Storage::disk('local')->assertExists($payment->proof_of_payment_path);
});

test('payment cannot exceed the invoice remaining balance', function () {
    $user = User::factory()->create();
    $invoice = Invoice::factory()->create(['status' => 'issued', 'total' => 1_000_000]);

    $this->actingAs($user)->post(route('invoices.payments.store', $invoice), [
        'amount' => 1_000_001,
        'payment_date' => now()->toDateString(),
    ])->assertSessionHasErrors('amount');

    expect($invoice->payments()->count())->toBe(0);
});

test('payment cannot exceed the remaining balance after a prior payment', function () {
    $user = User::factory()->create();
    $invoice = Invoice::factory()->create(['status' => 'issued', 'total' => 1_000_000]);

    $this->actingAs($user)->post(route('invoices.payments.store', $invoice), [
        'amount' => 600_000,
        'payment_date' => now()->toDateString(),
    ])->assertSessionHasNoErrors();

    $this->actingAs($user)->post(route('invoices.payments.store', $invoice), [
        'amount' => 400_001,
        'payment_date' => now()->toDateString(),
    ])->assertSessionHasErrors('amount');

    expect($invoice->payments()->count())->toBe(1);
});

test('payment can be recorded against an issued invoice', function () {
    $user = User::factory()->create();
    $invoice = Invoice::factory()->create(['status' => 'issued', 'total' => 1_000_000]);

    $response = $this->actingAs($user)->post(route('invoices.payments.store', $invoice), [
        'amount' => 400_000,
        'payment_date' => now()->toDateString(),
        'method' => 'Bank Transfer',
    ]);

    $response->assertSessionHasNoErrors();
    $response->assertRedirect(route('invoices.show', $invoice));

    $payment = $invoice->payments()->sole();
    expect((float) $payment->amount)->toBe(400_000.0);
    expect($payment->recorded_by)->toBe($user->id);
    expect($invoice->refresh()->payment_status)->toBe('partially_paid');
});

test('payment status becomes paid once the total is covered', function () {
    $user = User::factory()->create();
    $invoice = Invoice::factory()->create(['status' => 'issued', 'total' => 1_000_000]);

    $this->actingAs($user)->post(route('invoices.payments.store', $invoice), [
        'amount' => 600_000,
        'payment_date' => now()->toDateString(),
    ])->assertSessionHasNoErrors();

    expect($invoice->refresh()->payment_status)->toBe('partially_paid');

    $this->actingAs($user)->post(route('invoices.payments.store', $invoice), [
        'amount' => 400_000,
        'payment_date' => now()->toDateString(),
    ])->assertSessionHasNoErrors();

    expect($invoice->refresh()->payment_status)->toBe('paid');
});

test('payment cannot be recorded against a draft invoice', function () {
    $user = User::factory()->create();
    $invoice = Invoice::factory()->create(['status' => 'draft']);

    $this->actingAs($user)->post(route('invoices.payments.store', $invoice), [
        'amount' => 100_000,
        'payment_date' => now()->toDateString(),
    ])->assertForbidden();
});

test('guests cannot record payments', function () {
    $invoice = Invoice::factory()->create(['status' => 'issued']);

    $this->post(route('invoices.payments.store', $invoice), [])
        ->assertRedirect(route('login'));
});
