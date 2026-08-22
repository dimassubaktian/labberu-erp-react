<?php

use App\Models\PurchaseInvoice;
use App\Models\PurchaseOrder;
use App\Models\User;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;

beforeEach(function () {
    Storage::fake('local');
});

test('payment can be recorded with a proof of payment file', function () {
    $user = User::factory()->create();
    $purchaseInvoice = PurchaseInvoice::factory()->create(['status' => 'issued', 'total' => 1_000_000]);

    $response = $this->actingAs($user)->post(route('purchase-invoices.payments.store', $purchaseInvoice), [
        'amount' => 400_000,
        'payment_date' => now()->toDateString(),
        'proof_of_payment' => UploadedFile::fake()->create('proof.pdf', 100, 'application/pdf'),
    ]);

    $response->assertSessionHasNoErrors();

    $payment = $purchaseInvoice->payments()->sole();
    expect($payment->proof_of_payment_path)->not->toBeNull();
    Storage::disk('local')->assertExists($payment->proof_of_payment_path);
});

test('payment cannot exceed the purchase invoice remaining balance', function () {
    $user = User::factory()->create();
    $purchaseInvoice = PurchaseInvoice::factory()->create(['status' => 'issued', 'total' => 1_000_000]);

    $this->actingAs($user)->post(route('purchase-invoices.payments.store', $purchaseInvoice), [
        'amount' => 1_000_001,
        'payment_date' => now()->toDateString(),
    ])->assertSessionHasErrors('amount');

    expect($purchaseInvoice->payments()->count())->toBe(0);
});

test('payment can be recorded against an issued purchase invoice', function () {
    $user = User::factory()->create();
    $purchaseInvoice = PurchaseInvoice::factory()->create(['status' => 'issued', 'total' => 1_000_000]);

    $response = $this->actingAs($user)->post(route('purchase-invoices.payments.store', $purchaseInvoice), [
        'amount' => 400_000,
        'payment_date' => now()->toDateString(),
        'method' => 'Bank Transfer',
    ]);

    $response->assertSessionHasNoErrors();
    $response->assertRedirect(route('purchase-invoices.show', $purchaseInvoice));

    $payment = $purchaseInvoice->payments()->sole();
    expect((float) $payment->amount)->toBe(400_000.0);
    expect($payment->recorded_by)->toBe($user->id);
    expect($purchaseInvoice->refresh()->payment_status)->toBe('partially_paid');
});

test('payment status becomes paid once the total is covered', function () {
    $user = User::factory()->create();
    $purchaseInvoice = PurchaseInvoice::factory()->create(['status' => 'issued', 'total' => 1_000_000]);

    $this->actingAs($user)->post(route('purchase-invoices.payments.store', $purchaseInvoice), [
        'amount' => 600_000,
        'payment_date' => now()->toDateString(),
    ])->assertSessionHasNoErrors();

    expect($purchaseInvoice->refresh()->payment_status)->toBe('partially_paid');

    $this->actingAs($user)->post(route('purchase-invoices.payments.store', $purchaseInvoice), [
        'amount' => 400_000,
        'payment_date' => now()->toDateString(),
    ])->assertSessionHasNoErrors();

    expect($purchaseInvoice->refresh()->payment_status)->toBe('paid');
});

test('recording a payment also updates the purchase order\'s payment status', function () {
    $user = User::factory()->create();
    $purchaseOrder = PurchaseOrder::factory()->create(['grand_total' => 1_000_000]);
    $purchaseInvoice = PurchaseInvoice::factory()->create([
        'purchase_order_id' => $purchaseOrder->id,
        'status' => 'issued',
        'total' => 1_000_000,
    ]);

    $this->actingAs($user)->post(route('purchase-invoices.payments.store', $purchaseInvoice), [
        'amount' => 400_000,
        'payment_date' => now()->toDateString(),
    ])->assertSessionHasNoErrors();

    expect($purchaseOrder->refresh()->payment_status)->toBe('partially_paid');

    $this->actingAs($user)->post(route('purchase-invoices.payments.store', $purchaseInvoice), [
        'amount' => 600_000,
        'payment_date' => now()->toDateString(),
    ])->assertSessionHasNoErrors();

    expect($purchaseOrder->refresh()->payment_status)->toBe('paid');
});

test('the purchase order\'s payment status sums payments across all of its purchase invoices', function () {
    $user = User::factory()->create();
    $purchaseOrder = PurchaseOrder::factory()->create(['grand_total' => 1_000_000]);
    $firstInvoice = PurchaseInvoice::factory()->create([
        'purchase_order_id' => $purchaseOrder->id,
        'status' => 'issued',
        'total' => 400_000,
    ]);
    $secondInvoice = PurchaseInvoice::factory()->create([
        'purchase_order_id' => $purchaseOrder->id,
        'status' => 'issued',
        'total' => 600_000,
    ]);

    $this->actingAs($user)->post(route('purchase-invoices.payments.store', $firstInvoice), [
        'amount' => 400_000,
        'payment_date' => now()->toDateString(),
    ])->assertSessionHasNoErrors();

    expect($purchaseOrder->refresh()->payment_status)->toBe('partially_paid');

    $this->actingAs($user)->post(route('purchase-invoices.payments.store', $secondInvoice), [
        'amount' => 600_000,
        'payment_date' => now()->toDateString(),
    ])->assertSessionHasNoErrors();

    expect($purchaseOrder->refresh()->payment_status)->toBe('paid');
});

test('payment cannot be recorded against a draft purchase invoice', function () {
    $user = User::factory()->create();
    $purchaseInvoice = PurchaseInvoice::factory()->create(['status' => 'draft']);

    $this->actingAs($user)->post(route('purchase-invoices.payments.store', $purchaseInvoice), [
        'amount' => 100_000,
        'payment_date' => now()->toDateString(),
    ])->assertForbidden();
});

test('guests cannot record payments', function () {
    $purchaseInvoice = PurchaseInvoice::factory()->create(['status' => 'issued']);

    $this->post(route('purchase-invoices.payments.store', $purchaseInvoice), [])
        ->assertRedirect(route('login'));
});
