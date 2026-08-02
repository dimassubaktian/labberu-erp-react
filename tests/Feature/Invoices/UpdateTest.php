<?php

use App\Models\Invoice;
use App\Models\Product;
use App\Models\Quotation;
use App\Models\User;

function pricedQuotationWithItem(): Quotation
{
    $quotation = Quotation::factory()->create(['status' => 'approved']);

    $quotation->items()->create([
        'product_id' => Product::factory()->create()->id,
        'quantity' => 10,
        'unit' => 'Pcs',
        'unit_price' => 100_000,
        'unit_cost' => 50_000,
        'total_price' => 1_000_000,
        'total_cost' => 500_000,
        'margin' => 500_000,
        'margin_percent' => 50,
    ]);

    return $quotation->fresh('items');
}

test('draft invoice can be updated', function () {
    $user = User::factory()->create();
    $quotation = pricedQuotationWithItem();
    $item = $quotation->items->first();
    $invoice = Invoice::factory()->create([
        'quotation_id' => $quotation->id,
        'status' => 'draft',
    ]);

    $response = $this->actingAs($user)->put(route('invoices.update', $invoice), [
        'quotation_id' => $quotation->id,
        'invoice_date' => now()->toDateString(),
        'due_date' => now()->addDays(30)->toDateString(),
        'remarks' => 'Updated remarks',
        'items' => [
            ['quotation_item_id' => $item->id, 'quantity_invoiced' => 5],
        ],
    ]);

    $response->assertSessionHasNoErrors();
    $response->assertRedirect(route('invoices.show', $invoice));

    $invoice->refresh();
    expect($invoice->remarks)->toBe('Updated remarks');
    expect((float) $invoice->total)->toBe(500_000.0);
});

test('the quotation cannot be changed once an invoice is created', function () {
    $user = User::factory()->create();
    $quotation = pricedQuotationWithItem();
    $otherQuotation = pricedQuotationWithItem();
    $item = $quotation->items->first();
    $invoice = Invoice::factory()->create([
        'quotation_id' => $quotation->id,
        'status' => 'draft',
    ]);

    $this->actingAs($user)->put(route('invoices.update', $invoice), [
        'quotation_id' => $otherQuotation->id,
        'invoice_date' => now()->toDateString(),
        'due_date' => now()->addDays(30)->toDateString(),
        'items' => [
            ['quotation_item_id' => $item->id, 'quantity_invoiced' => 1],
        ],
    ])->assertSessionHasErrors(['quotation_id']);

    expect($invoice->refresh()->quotation_id)->toBe($quotation->id);
});

test('issued invoice cannot be updated', function () {
    $user = User::factory()->create();
    $quotation = pricedQuotationWithItem();
    $item = $quotation->items->first();
    $invoice = Invoice::factory()->create([
        'quotation_id' => $quotation->id,
        'status' => 'issued',
    ]);

    $this->actingAs($user)->put(route('invoices.update', $invoice), [
        'quotation_id' => $quotation->id,
        'invoice_date' => now()->toDateString(),
        'due_date' => now()->addDays(30)->toDateString(),
        'items' => [
            ['quotation_item_id' => $item->id, 'quantity_invoiced' => 1],
        ],
    ])->assertForbidden();
});

test('guests cannot update invoices', function () {
    $invoice = Invoice::factory()->create();

    $this->put(route('invoices.update', $invoice), [])
        ->assertRedirect(route('login'));
});
