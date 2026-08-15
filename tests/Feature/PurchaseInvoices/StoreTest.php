<?php

use App\Models\Product;
use App\Models\PurchaseInvoice;
use App\Models\PurchaseOrder;
use App\Models\Tax;
use App\Models\User;

function approvedPurchaseOrderWithPricedItem(array $overrides = []): PurchaseOrder
{
    $purchaseOrder = PurchaseOrder::factory()->create(array_merge(['status' => 'approved'], $overrides));

    $purchaseOrder->items()->create([
        'product_id' => Product::factory()->create()->id,
        'quantity' => 10,
        'unit' => 'Pcs',
        'unit_price' => 100_000,
        'total' => 1_000_000,
    ]);

    return $purchaseOrder->fresh('items');
}

test('purchase invoice can be created against an approved purchase order with totals calculated', function () {
    $user = User::factory()->create();
    $purchaseOrder = approvedPurchaseOrderWithPricedItem();
    $item = $purchaseOrder->items->first();

    $response = $this->actingAs($user)->post(route('purchase-invoices.store'), [
        'purchase_order_id' => $purchaseOrder->id,
        'invoice_date' => now()->toDateString(),
        'due_date' => now()->addDays(30)->toDateString(),
        'items' => [
            ['purchase_order_item_id' => $item->id, 'quantity_invoiced' => 4],
        ],
    ]);

    $response->assertSessionHasNoErrors();

    $purchaseInvoice = PurchaseInvoice::sole();
    $response->assertRedirect(route('purchase-invoices.show', $purchaseInvoice));
    expect($purchaseInvoice->status)->toBe('draft');
    expect($purchaseInvoice->purchase_invoice_code)->toStartWith('LAB-PINV');
    expect((float) $purchaseInvoice->subtotal)->toBe(400_000.0);
    expect((float) $purchaseInvoice->total)->toBe(400_000.0);

    $purchaseInvoiceItem = $purchaseInvoice->items()->sole();
    expect($purchaseInvoiceItem->product_id)->toBe($item->product_id);
    expect($purchaseInvoiceItem->purchase_order_item_id)->toBe($item->id);
    expect((float) $purchaseInvoiceItem->quantity_ordered)->toBe(10.0);
    expect((float) $purchaseInvoiceItem->unit_price)->toBe(100_000.0);
    expect((float) $purchaseInvoiceItem->quantity_invoiced)->toBe(4.0);
    expect((float) $purchaseInvoiceItem->total)->toBe(400_000.0);
});

test('discount is applied before tax', function () {
    $user = User::factory()->create();
    $purchaseOrder = approvedPurchaseOrderWithPricedItem();
    $item = $purchaseOrder->items->first();
    $tax = Tax::factory()->percentage()->create(['rate' => 10]);

    $this->actingAs($user)->post(route('purchase-invoices.store'), [
        'purchase_order_id' => $purchaseOrder->id,
        'invoice_date' => now()->toDateString(),
        'due_date' => now()->addDays(30)->toDateString(),
        'discount_type' => 'percentage',
        'discount_value' => 10,
        'tax_id' => $tax->id,
        'items' => [
            ['purchase_order_item_id' => $item->id, 'quantity_invoiced' => 10],
        ],
    ])->assertSessionHasNoErrors();

    $purchaseInvoice = PurchaseInvoice::sole();
    expect((float) $purchaseInvoice->subtotal)->toBe(1_000_000.0);
    expect((float) $purchaseInvoice->discount_amount)->toBe(100_000.0);
    expect((float) $purchaseInvoice->tax_amount)->toBe(90_000.0);
    expect((float) $purchaseInvoice->total)->toBe(990_000.0);
});

test('purchase invoice cannot be created against a non-approved purchase order', function () {
    $user = User::factory()->create();
    $purchaseOrder = approvedPurchaseOrderWithPricedItem(['status' => 'draft']);
    $item = $purchaseOrder->items->first();

    $this->actingAs($user)->post(route('purchase-invoices.store'), [
        'purchase_order_id' => $purchaseOrder->id,
        'invoice_date' => now()->toDateString(),
        'due_date' => now()->addDays(30)->toDateString(),
        'items' => [
            ['purchase_order_item_id' => $item->id, 'quantity_invoiced' => 1],
        ],
    ])->assertForbidden();
});

test('items must belong to the selected purchase order', function () {
    $user = User::factory()->create();
    $purchaseOrder = approvedPurchaseOrderWithPricedItem();
    $otherPurchaseOrder = approvedPurchaseOrderWithPricedItem();
    $otherItem = $otherPurchaseOrder->items->first();

    $this->actingAs($user)->post(route('purchase-invoices.store'), [
        'purchase_order_id' => $purchaseOrder->id,
        'invoice_date' => now()->toDateString(),
        'due_date' => now()->addDays(30)->toDateString(),
        'items' => [
            ['purchase_order_item_id' => $otherItem->id, 'quantity_invoiced' => 1],
        ],
    ])->assertSessionHasErrors(['items.0.purchase_order_item_id']);
});

test('at least one item is required', function () {
    $user = User::factory()->create();
    $purchaseOrder = approvedPurchaseOrderWithPricedItem();

    $this->actingAs($user)->post(route('purchase-invoices.store'), [
        'purchase_order_id' => $purchaseOrder->id,
        'invoice_date' => now()->toDateString(),
        'due_date' => now()->addDays(30)->toDateString(),
        'items' => [],
    ])->assertSessionHasErrors(['items']);
});

test('guests cannot create purchase invoices', function () {
    $this->post(route('purchase-invoices.store'), [])
        ->assertRedirect(route('login'));
});
