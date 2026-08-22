<?php

use App\Models\PurchaseInvoice;
use App\Models\PurchaseInvoicePayment;
use App\Models\User;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;

beforeEach(function () {
    Storage::fake('local');
});

function purchaseInvoicePaymentWithoutProof(PurchaseInvoice $purchaseInvoice): PurchaseInvoicePayment
{
    return $purchaseInvoice->payments()->create([
        'amount' => 100_000,
        'payment_date' => now()->toDateString(),
        'recorded_by' => User::factory()->create()->id,
    ]);
}

test('proof of payment can be downloaded', function () {
    $user = User::factory()->create();
    $purchaseInvoice = PurchaseInvoice::factory()->create(['status' => 'issued', 'total' => 1_000_000]);

    $this->actingAs($user)->post(route('purchase-invoices.payments.store', $purchaseInvoice), [
        'amount' => 400_000,
        'payment_date' => now()->toDateString(),
        'proof_of_payment' => UploadedFile::fake()->create('proof.pdf', 100, 'application/pdf'),
    ])->assertSessionHasNoErrors();

    $payment = $purchaseInvoice->payments()->sole();

    $this->actingAs($user)
        ->get(route('purchase-invoices.payments.proof', [$purchaseInvoice, $payment]))
        ->assertOk();
});

test('proof of payment returns 404 when none was uploaded', function () {
    $user = User::factory()->create();
    $purchaseInvoice = PurchaseInvoice::factory()->create(['status' => 'issued']);
    $payment = purchaseInvoicePaymentWithoutProof($purchaseInvoice);

    $this->actingAs($user)
        ->get(route('purchase-invoices.payments.proof', [$purchaseInvoice, $payment]))
        ->assertNotFound();
});

test('proof of payment returns 404 when the payment does not belong to the purchase invoice', function () {
    $user = User::factory()->create();
    $purchaseInvoice = PurchaseInvoice::factory()->create(['status' => 'issued']);
    $otherPurchaseInvoice = PurchaseInvoice::factory()->create(['status' => 'issued']);
    $payment = purchaseInvoicePaymentWithoutProof($otherPurchaseInvoice);

    $this->actingAs($user)
        ->get(route('purchase-invoices.payments.proof', [$purchaseInvoice, $payment]))
        ->assertNotFound();
});

test('guests cannot download proof of payment', function () {
    $purchaseInvoice = PurchaseInvoice::factory()->create(['status' => 'issued']);
    $payment = purchaseInvoicePaymentWithoutProof($purchaseInvoice);

    $this->get(route('purchase-invoices.payments.proof', [$purchaseInvoice, $payment]))
        ->assertRedirect(route('login'));
});
