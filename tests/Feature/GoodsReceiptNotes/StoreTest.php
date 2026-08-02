<?php

use App\Models\GoodsReceiptNote;
use App\Models\Product;
use App\Models\PurchaseOrder;
use App\Models\User;

function approvedPurchaseOrderWithItem(array $overrides = []): PurchaseOrder
{
    $purchaseOrder = PurchaseOrder::factory()->create(array_merge(['status' => 'approved'], $overrides));

    $purchaseOrder->items()->create([
        'product_id' => Product::factory()->create()->id,
        'quantity' => 10,
        'unit' => 'Pcs',
        'unit_price' => 1_000,
        'total' => 10_000,
    ]);

    return $purchaseOrder->fresh('items');
}

test('goods receipt note can be created against an approved purchase order', function () {
    $user = User::factory()->create();
    $purchaseOrder = approvedPurchaseOrderWithItem();
    $item = $purchaseOrder->items->first();

    $response = $this->actingAs($user)->post(route('goods-receipt-notes.store'), [
        'purchase_order_id' => $purchaseOrder->id,
        'received_date' => now()->toDateString(),
        'items' => [
            [
                'purchase_order_item_id' => $item->id,
                'quantity_accepted' => 6,
                'quantity_rejected' => 1,
                'rejection_reason' => 'Damaged in transit',
            ],
        ],
    ]);

    $response->assertSessionHasNoErrors();

    $goodsReceiptNote = GoodsReceiptNote::sole();
    $response->assertRedirect(route('goods-receipt-notes.show', $goodsReceiptNote));
    expect($goodsReceiptNote->status)->toBe('draft');
    expect($goodsReceiptNote->grn_code)->toStartWith('LAB-GRN');

    $grnItem = $goodsReceiptNote->items()->sole();
    expect($grnItem->product_id)->toBe($item->product_id);
    expect($grnItem->purchase_order_item_id)->toBe($item->id);
    expect((float) $grnItem->quantity_ordered)->toBe(10.0);
    expect($grnItem->unit)->toBe('Pcs');
    expect((float) $grnItem->quantity_accepted)->toBe(6.0);
    expect((float) $grnItem->quantity_rejected)->toBe(1.0);
    expect($grnItem->rejection_reason)->toBe('Damaged in transit');
});

test('goods receipt note cannot be created against a non-approved purchase order', function () {
    $user = User::factory()->create();
    $purchaseOrder = approvedPurchaseOrderWithItem(['status' => 'draft']);
    $item = $purchaseOrder->items->first();

    $this->actingAs($user)->post(route('goods-receipt-notes.store'), [
        'purchase_order_id' => $purchaseOrder->id,
        'received_date' => now()->toDateString(),
        'items' => [
            ['purchase_order_item_id' => $item->id, 'quantity_accepted' => 1],
        ],
    ])->assertForbidden();
});

test('items must belong to the selected purchase order', function () {
    $user = User::factory()->create();
    $purchaseOrder = approvedPurchaseOrderWithItem();
    $otherPurchaseOrder = approvedPurchaseOrderWithItem();
    $otherItem = $otherPurchaseOrder->items->first();

    $this->actingAs($user)->post(route('goods-receipt-notes.store'), [
        'purchase_order_id' => $purchaseOrder->id,
        'received_date' => now()->toDateString(),
        'items' => [
            ['purchase_order_item_id' => $otherItem->id, 'quantity_accepted' => 1],
        ],
    ])->assertSessionHasErrors(['items.0.purchase_order_item_id']);
});

test('at least one item is required', function () {
    $user = User::factory()->create();
    $purchaseOrder = approvedPurchaseOrderWithItem();

    $this->actingAs($user)->post(route('goods-receipt-notes.store'), [
        'purchase_order_id' => $purchaseOrder->id,
        'received_date' => now()->toDateString(),
        'items' => [],
    ])->assertSessionHasErrors(['items']);
});

test('guests cannot create goods receipt notes', function () {
    $this->post(route('goods-receipt-notes.store'), [])
        ->assertRedirect(route('login'));
});
