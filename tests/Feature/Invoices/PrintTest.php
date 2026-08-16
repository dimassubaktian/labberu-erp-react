<?php

use App\Models\Invoice;
use App\Models\PaymentTermTemplate;
use App\Models\Product;
use App\Models\Quotation;
use App\Models\User;

function invoiceWithItem(array $overrides = []): Invoice
{
    $invoice = Invoice::factory()->create(array_merge([
        'quotation_id' => Quotation::factory()->create(['po_number' => 'PO-123', 'po_date' => now()])->id,
        'subtotal' => 1_000_000,
        'total' => 1_000_000,
    ], $overrides));

    $invoice->items()->create([
        'product_id' => Product::factory()->create()->id,
        'quantity_ordered' => 10,
        'unit' => 'Pcs',
        'unit_price' => 100_000,
        'quantity_invoiced' => 10,
        'total' => 1_000_000,
    ]);

    return $invoice->fresh('items');
}

test('invoice print streams pdf inline by default', function () {
    $user = User::factory()->create();
    $invoice = invoiceWithItem();

    $response = $this->actingAs($user)
        ->get(route('invoices.print', $invoice));

    $response->assertOk();
    $response->assertHeader('Content-Type', 'application/pdf');
    expect($response->headers->get('Content-Disposition'))->toContain('inline');
});

test('invoice print forces download when download param is true', function () {
    $user = User::factory()->create();
    $invoice = invoiceWithItem();

    $response = $this->actingAs($user)
        ->get(route('invoices.print', [$invoice, 'download' => 'true']));

    $response->assertOk();
    $response->assertHeader('Content-Type', 'application/pdf');
    expect($response->headers->get('Content-Disposition'))->toContain('attachment');
    expect($response->headers->get('Content-Disposition'))->toContain("invoice-{$invoice->invoice_code}.pdf");
});

test('invoice print renders the payment terms snapshotted on the invoice', function () {
    $user = User::factory()->create();
    $invoice = invoiceWithItem([
        'payment_term_template_id' => PaymentTermTemplate::factory()->create()->id,
        'payment_terms_html' => '<p>50% down payment, 50% on delivery.</p>',
    ]);

    $response = $this->actingAs($user)
        ->get(route('invoices.print', $invoice));

    $response->assertOk();
    $response->assertHeader('Content-Type', 'application/pdf');
});

test('invoice print renders ok without payment terms', function () {
    $user = User::factory()->create();
    $invoice = invoiceWithItem([
        'payment_term_template_id' => null,
        'payment_terms_html' => null,
    ]);

    $response = $this->actingAs($user)
        ->get(route('invoices.print', $invoice));

    $response->assertOk();
    $response->assertHeader('Content-Type', 'application/pdf');
});

test('invoice print renders ok without a customer po number', function () {
    $user = User::factory()->create();
    $invoice = invoiceWithItem([
        'quotation_id' => Quotation::factory()->create(['po_number' => null, 'po_date' => null])->id,
    ]);

    $response = $this->actingAs($user)
        ->get(route('invoices.print', $invoice));

    $response->assertOk();
    $response->assertHeader('Content-Type', 'application/pdf');
});

test('guests cannot print an invoice', function () {
    $invoice = invoiceWithItem();

    $this->get(route('invoices.print', $invoice))
        ->assertRedirect(route('login'));
});
