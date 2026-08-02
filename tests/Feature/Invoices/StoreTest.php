<?php

use App\Models\Invoice;
use App\Models\Product;
use App\Models\Quotation;
use App\Models\Tax;
use App\Models\User;

function approvedQuotationWithPricedItem(array $overrides = []): Quotation
{
    $quotation = Quotation::factory()->create(array_merge(['status' => 'approved'], $overrides));

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

test('invoice can be created against an approved quotation with totals calculated', function () {
    $user = User::factory()->create();
    $quotation = approvedQuotationWithPricedItem();
    $item = $quotation->items->first();

    $response = $this->actingAs($user)->post(route('invoices.store'), [
        'quotation_id' => $quotation->id,
        'invoice_date' => now()->toDateString(),
        'due_date' => now()->addDays(30)->toDateString(),
        'items' => [
            ['quotation_item_id' => $item->id, 'quantity_invoiced' => 4],
        ],
    ]);

    $response->assertSessionHasNoErrors();

    $invoice = Invoice::sole();
    $response->assertRedirect(route('invoices.show', $invoice));
    expect($invoice->status)->toBe('draft');
    expect($invoice->invoice_code)->toStartWith('LAB-INV');
    expect((float) $invoice->subtotal)->toBe(400_000.0);
    expect((float) $invoice->total)->toBe(400_000.0);

    $invoiceItem = $invoice->items()->sole();
    expect($invoiceItem->product_id)->toBe($item->product_id);
    expect($invoiceItem->quotation_item_id)->toBe($item->id);
    expect((float) $invoiceItem->quantity_ordered)->toBe(10.0);
    expect((float) $invoiceItem->unit_price)->toBe(100_000.0);
    expect((float) $invoiceItem->quantity_invoiced)->toBe(4.0);
    expect((float) $invoiceItem->total)->toBe(400_000.0);
});

test('discount is applied before tax', function () {
    $user = User::factory()->create();
    $quotation = approvedQuotationWithPricedItem();
    $item = $quotation->items->first();
    $tax = Tax::factory()->percentage()->create(['rate' => 10]);

    $this->actingAs($user)->post(route('invoices.store'), [
        'quotation_id' => $quotation->id,
        'invoice_date' => now()->toDateString(),
        'due_date' => now()->addDays(30)->toDateString(),
        'discount_type' => 'percentage',
        'discount_value' => 10,
        'tax_id' => $tax->id,
        'items' => [
            ['quotation_item_id' => $item->id, 'quantity_invoiced' => 10],
        ],
    ])->assertSessionHasNoErrors();

    $invoice = Invoice::sole();
    expect((float) $invoice->subtotal)->toBe(1_000_000.0);
    expect((float) $invoice->discount_amount)->toBe(100_000.0);
    expect((float) $invoice->tax_amount)->toBe(90_000.0);
    expect((float) $invoice->total)->toBe(990_000.0);
});

test('invoice cannot be created against a non-approved quotation', function () {
    $user = User::factory()->create();
    $quotation = approvedQuotationWithPricedItem(['status' => 'draft']);
    $item = $quotation->items->first();

    $this->actingAs($user)->post(route('invoices.store'), [
        'quotation_id' => $quotation->id,
        'invoice_date' => now()->toDateString(),
        'due_date' => now()->addDays(30)->toDateString(),
        'items' => [
            ['quotation_item_id' => $item->id, 'quantity_invoiced' => 1],
        ],
    ])->assertForbidden();
});

test('items must belong to the selected quotation', function () {
    $user = User::factory()->create();
    $quotation = approvedQuotationWithPricedItem();
    $otherQuotation = approvedQuotationWithPricedItem();
    $otherItem = $otherQuotation->items->first();

    $this->actingAs($user)->post(route('invoices.store'), [
        'quotation_id' => $quotation->id,
        'invoice_date' => now()->toDateString(),
        'due_date' => now()->addDays(30)->toDateString(),
        'items' => [
            ['quotation_item_id' => $otherItem->id, 'quantity_invoiced' => 1],
        ],
    ])->assertSessionHasErrors(['items.0.quotation_item_id']);
});

test('at least one item is required', function () {
    $user = User::factory()->create();
    $quotation = approvedQuotationWithPricedItem();

    $this->actingAs($user)->post(route('invoices.store'), [
        'quotation_id' => $quotation->id,
        'invoice_date' => now()->toDateString(),
        'due_date' => now()->addDays(30)->toDateString(),
        'items' => [],
    ])->assertSessionHasErrors(['items']);
});

test('guests cannot create invoices', function () {
    $this->post(route('invoices.store'), [])
        ->assertRedirect(route('login'));
});
