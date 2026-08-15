<?php

use App\Models\Product;
use App\Models\PurchaseInvoice;
use App\Models\PurchaseOrder;
use App\Models\User;

test('purchase order items are listed with unit price and invoiced/remaining-to-invoice quantities', function () {
    $user = User::factory()->create();
    $purchaseOrder = PurchaseOrder::factory()->create();
    $item = $purchaseOrder->items()->create([
        'product_id' => Product::factory()->create()->id,
        'quantity' => 10,
        'unit' => 'Pcs',
        'unit_price' => 100_000,
        'total' => 1_000_000,
    ]);

    $purchaseInvoice = PurchaseInvoice::factory()->create(['purchase_order_id' => $purchaseOrder->id]);
    $purchaseInvoice->items()->create([
        'product_id' => $item->product_id,
        'purchase_order_item_id' => $item->id,
        'quantity_ordered' => $item->quantity,
        'unit' => $item->unit,
        'unit_price' => $item->unit_price,
        'quantity_invoiced' => 4,
        'total' => 400_000,
    ]);

    $response = $this->actingAs($user)
        ->getJson(route('purchase-orders.invoice-items.index', $purchaseOrder))
        ->assertOk()
        ->assertJsonCount(1, 'data');

    expect((float) $response->json('data.0.unit_price'))->toBe(100_000.0);
    expect((float) $response->json('data.0.invoiced'))->toBe(4.0);
    expect((float) $response->json('data.0.remaining_to_invoice'))->toBe(6.0);
});

test('draft purchase invoices still count toward the invoiced quantity', function () {
    $user = User::factory()->create();
    $purchaseOrder = PurchaseOrder::factory()->create();
    $item = $purchaseOrder->items()->create([
        'product_id' => Product::factory()->create()->id,
        'quantity' => 10,
        'unit' => 'Pcs',
        'unit_price' => 100_000,
        'total' => 1_000_000,
    ]);

    $purchaseInvoice = PurchaseInvoice::factory()->create(['purchase_order_id' => $purchaseOrder->id, 'status' => 'draft']);
    $purchaseInvoice->items()->create([
        'product_id' => $item->product_id,
        'purchase_order_item_id' => $item->id,
        'quantity_ordered' => $item->quantity,
        'unit' => $item->unit,
        'unit_price' => $item->unit_price,
        'quantity_invoiced' => 4,
        'total' => 400_000,
    ]);

    $response = $this->actingAs($user)
        ->getJson(route('purchase-orders.invoice-items.index', $purchaseOrder))
        ->assertOk();

    expect((float) $response->json('data.0.invoiced'))->toBe(4.0);
    expect((float) $response->json('data.0.remaining_to_invoice'))->toBe(6.0);
});

test('guests cannot view purchase order invoice items', function () {
    $purchaseOrder = PurchaseOrder::factory()->create();

    $this->getJson(route('purchase-orders.invoice-items.index', $purchaseOrder))
        ->assertUnauthorized();
});
