<?php

use App\Models\Product;
use App\Models\PurchaseInvoice;
use App\Models\PurchaseOrder;
use App\Models\User;

function pricedPurchaseOrderWithItem(): PurchaseOrder
{
    $purchaseOrder = PurchaseOrder::factory()->create(['status' => 'approved']);

    $purchaseOrder->items()->create([
        'product_id' => Product::factory()->create()->id,
        'quantity' => 10,
        'unit' => 'Pcs',
        'unit_price' => 100_000,
        'total' => 1_000_000,
    ]);

    return $purchaseOrder->fresh('items');
}

test('draft purchase invoice can be updated', function () {
    $user = User::factory()->create();
    $purchaseOrder = pricedPurchaseOrderWithItem();
    $item = $purchaseOrder->items->first();
    $purchaseInvoice = PurchaseInvoice::factory()->create([
        'purchase_order_id' => $purchaseOrder->id,
        'status' => 'draft',
    ]);

    $response = $this->actingAs($user)->put(route('purchase-invoices.update', $purchaseInvoice), [
        'invoice_date' => now()->toDateString(),
        'due_date' => now()->addDays(30)->toDateString(),
        'remarks' => 'Updated remarks',
        'items' => [
            ['purchase_order_item_id' => $item->id, 'quantity_invoiced' => 5],
        ],
    ]);

    $response->assertSessionHasNoErrors();
    $response->assertRedirect(route('purchase-invoices.show', $purchaseInvoice));

    $purchaseInvoice->refresh();
    expect($purchaseInvoice->remarks)->toBe('Updated remarks');
    expect((float) $purchaseInvoice->total)->toBe(500_000.0);
});

test('items must belong to the invoice\'s purchase order', function () {
    $user = User::factory()->create();
    $purchaseOrder = pricedPurchaseOrderWithItem();
    $otherPurchaseOrder = pricedPurchaseOrderWithItem();
    $otherItem = $otherPurchaseOrder->items->first();
    $purchaseInvoice = PurchaseInvoice::factory()->create([
        'purchase_order_id' => $purchaseOrder->id,
        'status' => 'draft',
    ]);

    $this->actingAs($user)->put(route('purchase-invoices.update', $purchaseInvoice), [
        'invoice_date' => now()->toDateString(),
        'due_date' => now()->addDays(30)->toDateString(),
        'items' => [
            ['purchase_order_item_id' => $otherItem->id, 'quantity_invoiced' => 1],
        ],
    ])->assertSessionHasErrors(['items.0.purchase_order_item_id']);
});

test('issued purchase invoice cannot be updated', function () {
    $user = User::factory()->create();
    $purchaseOrder = pricedPurchaseOrderWithItem();
    $item = $purchaseOrder->items->first();
    $purchaseInvoice = PurchaseInvoice::factory()->create([
        'purchase_order_id' => $purchaseOrder->id,
        'status' => 'issued',
    ]);

    $this->actingAs($user)->put(route('purchase-invoices.update', $purchaseInvoice), [
        'invoice_date' => now()->toDateString(),
        'due_date' => now()->addDays(30)->toDateString(),
        'items' => [
            ['purchase_order_item_id' => $item->id, 'quantity_invoiced' => 1],
        ],
    ])->assertForbidden();
});

test('guests cannot update purchase invoices', function () {
    $purchaseInvoice = PurchaseInvoice::factory()->create();

    $this->put(route('purchase-invoices.update', $purchaseInvoice), [])
        ->assertRedirect(route('login'));
});
