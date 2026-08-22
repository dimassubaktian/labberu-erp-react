<?php

use App\Models\Invoice;
use App\Models\InvoicePayment;
use App\Models\User;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;

beforeEach(function () {
    Storage::fake('local');
});

function invoicePaymentWithoutProof(Invoice $invoice): InvoicePayment
{
    return $invoice->payments()->create([
        'amount' => 100_000,
        'payment_date' => now()->toDateString(),
        'recorded_by' => User::factory()->create()->id,
    ]);
}

test('proof of payment can be downloaded', function () {
    $user = User::factory()->create();
    $invoice = Invoice::factory()->create(['status' => 'issued', 'total' => 1_000_000]);

    $this->actingAs($user)->post(route('invoices.payments.store', $invoice), [
        'amount' => 400_000,
        'payment_date' => now()->toDateString(),
        'proof_of_payment' => UploadedFile::fake()->create('proof.pdf', 100, 'application/pdf'),
    ])->assertSessionHasNoErrors();

    $payment = $invoice->payments()->sole();

    $this->actingAs($user)
        ->get(route('invoices.payments.proof', [$invoice, $payment]))
        ->assertOk();
});

test('proof of payment returns 404 when none was uploaded', function () {
    $user = User::factory()->create();
    $invoice = Invoice::factory()->create(['status' => 'issued']);
    $payment = invoicePaymentWithoutProof($invoice);

    $this->actingAs($user)
        ->get(route('invoices.payments.proof', [$invoice, $payment]))
        ->assertNotFound();
});

test('proof of payment returns 404 when the payment does not belong to the invoice', function () {
    $user = User::factory()->create();
    $invoice = Invoice::factory()->create(['status' => 'issued']);
    $otherInvoice = Invoice::factory()->create(['status' => 'issued']);
    $payment = invoicePaymentWithoutProof($otherInvoice);

    $this->actingAs($user)
        ->get(route('invoices.payments.proof', [$invoice, $payment]))
        ->assertNotFound();
});

test('guests cannot download proof of payment', function () {
    $invoice = Invoice::factory()->create(['status' => 'issued']);
    $payment = invoicePaymentWithoutProof($invoice);

    $this->get(route('invoices.payments.proof', [$invoice, $payment]))
        ->assertRedirect(route('login'));
});
