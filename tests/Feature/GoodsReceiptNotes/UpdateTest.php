<?php

use App\Models\GoodsReceiptNote;
use App\Models\Product;
use App\Models\PurchaseOrder;
use App\Models\User;

function purchaseOrderWithItem(): PurchaseOrder
{
    $purchaseOrder = PurchaseOrder::factory()->create(['status' => 'approved']);

    $purchaseOrder->items()->create([
        'product_id' => Product::factory()->create()->id,
        'quantity' => 10,
        'unit' => 'Pcs',
        'unit_price' => 1_000,
        'total' => 10_000,
    ]);

    return $purchaseOrder->fresh('items');
}

test('draft goods receipt note can be updated', function () {
    $user = User::factory()->create();
    $purchaseOrder = purchaseOrderWithItem();
    $item = $purchaseOrder->items->first();
    $goodsReceiptNote = GoodsReceiptNote::factory()->create([
        'purchase_order_id' => $purchaseOrder->id,
        'status' => 'draft',
    ]);

    $response = $this->actingAs($user)->put(route('goods-receipt-notes.update', $goodsReceiptNote), [
        'purchase_order_id' => $purchaseOrder->id,
        'received_date' => now()->toDateString(),
        'remarks' => 'Updated remarks',
        'items' => [
            ['purchase_order_item_id' => $item->id, 'quantity_accepted' => 4],
        ],
    ]);

    $response->assertSessionHasNoErrors();
    $response->assertRedirect(route('goods-receipt-notes.show', $goodsReceiptNote));

    $goodsReceiptNote->refresh();
    expect($goodsReceiptNote->remarks)->toBe('Updated remarks');
    expect($goodsReceiptNote->items()->count())->toBe(1);
    expect((float) $goodsReceiptNote->items()->sole()->quantity_accepted)->toBe(4.0);
});

test('the purchase order cannot be changed once a goods receipt note is created', function () {
    $user = User::factory()->create();
    $purchaseOrder = purchaseOrderWithItem();
    $otherPurchaseOrder = purchaseOrderWithItem();
    $item = $purchaseOrder->items->first();
    $goodsReceiptNote = GoodsReceiptNote::factory()->create([
        'purchase_order_id' => $purchaseOrder->id,
        'status' => 'draft',
    ]);

    $this->actingAs($user)->put(route('goods-receipt-notes.update', $goodsReceiptNote), [
        'purchase_order_id' => $otherPurchaseOrder->id,
        'received_date' => now()->toDateString(),
        'items' => [
            ['purchase_order_item_id' => $item->id, 'quantity_accepted' => 1],
        ],
    ])->assertSessionHasErrors(['purchase_order_id']);

    expect($goodsReceiptNote->refresh()->purchase_order_id)->toBe($purchaseOrder->id);
});

test('confirmed goods receipt note cannot be updated', function () {
    $user = User::factory()->create();
    $purchaseOrder = purchaseOrderWithItem();
    $item = $purchaseOrder->items->first();
    $goodsReceiptNote = GoodsReceiptNote::factory()->create([
        'purchase_order_id' => $purchaseOrder->id,
        'status' => 'confirmed',
    ]);

    $this->actingAs($user)->put(route('goods-receipt-notes.update', $goodsReceiptNote), [
        'purchase_order_id' => $purchaseOrder->id,
        'received_date' => now()->toDateString(),
        'items' => [
            ['purchase_order_item_id' => $item->id, 'quantity_accepted' => 1],
        ],
    ])->assertForbidden();
});

test('guests cannot update goods receipt notes', function () {
    $goodsReceiptNote = GoodsReceiptNote::factory()->create();

    $this->put(route('goods-receipt-notes.update', $goodsReceiptNote), [])
        ->assertRedirect(route('login'));
});
