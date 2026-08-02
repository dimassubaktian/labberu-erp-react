<?php

use App\Models\GoodsReceiptNote;
use App\Models\Product;
use App\Models\PurchaseOrder;
use App\Models\User;

test('purchase order items are listed with received and remaining quantities', function () {
    $user = User::factory()->create();
    $purchaseOrder = PurchaseOrder::factory()->create();
    $item = $purchaseOrder->items()->create([
        'product_id' => Product::factory()->create()->id,
        'quantity' => 10,
        'unit' => 'Pcs',
        'unit_price' => 1_000,
        'total' => 10_000,
    ]);

    $goodsReceiptNote = GoodsReceiptNote::factory()->create([
        'purchase_order_id' => $purchaseOrder->id,
        'status' => 'confirmed',
    ]);
    $goodsReceiptNote->items()->create([
        'product_id' => $item->product_id,
        'purchase_order_item_id' => $item->id,
        'quantity_ordered' => $item->quantity,
        'unit' => $item->unit,
        'quantity_accepted' => 4,
    ]);

    $response = $this->actingAs($user)
        ->getJson(route('purchase-orders.items.index', $purchaseOrder))
        ->assertOk()
        ->assertJsonCount(1, 'data');

    expect((float) $response->json('data.0.received'))->toBe(4.0);
    expect((float) $response->json('data.0.remaining'))->toBe(6.0);
});

test('draft goods receipt notes are excluded from the received quantity', function () {
    $user = User::factory()->create();
    $purchaseOrder = PurchaseOrder::factory()->create();
    $item = $purchaseOrder->items()->create([
        'product_id' => Product::factory()->create()->id,
        'quantity' => 10,
        'unit' => 'Pcs',
        'unit_price' => 1_000,
        'total' => 10_000,
    ]);

    $goodsReceiptNote = GoodsReceiptNote::factory()->create([
        'purchase_order_id' => $purchaseOrder->id,
        'status' => 'draft',
    ]);
    $goodsReceiptNote->items()->create([
        'product_id' => $item->product_id,
        'purchase_order_item_id' => $item->id,
        'quantity_ordered' => $item->quantity,
        'unit' => $item->unit,
        'quantity_accepted' => 4,
    ]);

    $response = $this->actingAs($user)
        ->getJson(route('purchase-orders.items.index', $purchaseOrder))
        ->assertOk();

    expect((float) $response->json('data.0.received'))->toBe(0.0);
    expect((float) $response->json('data.0.remaining'))->toBe(10.0);
});

test('guests cannot view purchase order items', function () {
    $purchaseOrder = PurchaseOrder::factory()->create();

    $this->getJson(route('purchase-orders.items.index', $purchaseOrder))
        ->assertUnauthorized();
});
