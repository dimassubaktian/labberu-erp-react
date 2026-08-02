<?php

use App\Models\GoodsReceiptNote;
use App\Models\Product;
use App\Models\PurchaseOrder;
use App\Models\PurchaseOrderItem;
use App\Models\User;
use App\Models\Workforce;

/**
 * @param  array<int, float>  $quantities
 */
function purchaseOrderWithItemQuantities(array $quantities): PurchaseOrder
{
    $purchaseOrder = PurchaseOrder::factory()->create(['status' => 'approved']);

    foreach ($quantities as $quantity) {
        $purchaseOrder->items()->create([
            'product_id' => Product::factory()->create()->id,
            'quantity' => $quantity,
            'unit' => 'Pcs',
            'unit_price' => 1_000,
            'total' => $quantity * 1_000,
        ]);
    }

    return $purchaseOrder->fresh('items');
}

function draftGoodsReceiptNoteFor(PurchaseOrderItem $item, float $accepted): GoodsReceiptNote
{
    $goodsReceiptNote = GoodsReceiptNote::factory()->create([
        'purchase_order_id' => $item->purchase_order_id,
        'status' => 'draft',
    ]);

    $goodsReceiptNote->items()->create([
        'product_id' => $item->product_id,
        'purchase_order_item_id' => $item->id,
        'quantity_ordered' => $item->quantity,
        'unit' => $item->unit,
        'quantity_accepted' => $accepted,
    ]);

    return $goodsReceiptNote;
}

test('confirming a goods receipt note sets partially_received when not everything has arrived', function () {
    $user = User::factory()->create();
    $workforce = Workforce::factory()->create();
    $purchaseOrder = purchaseOrderWithItemQuantities([10]);
    $item = $purchaseOrder->items->first();
    $goodsReceiptNote = draftGoodsReceiptNoteFor($item, 4);

    $response = $this->actingAs($user)->patch(route('goods-receipt-notes.confirm', $goodsReceiptNote), [
        'received_by_id' => $workforce->id,
    ]);

    $response->assertSessionHasNoErrors();
    expect($goodsReceiptNote->refresh()->status)->toBe('confirmed');
    expect($goodsReceiptNote->received_by_id)->toBe($workforce->id);
    expect($goodsReceiptNote->received_at)->not->toBeNull();
    expect($purchaseOrder->refresh()->progress)->toBe('partially_received');
});

test('confirming enough goods receipt notes to cover every line sets fully_received', function () {
    $user = User::factory()->create();
    $purchaseOrder = purchaseOrderWithItemQuantities([10, 5]);
    [$itemA, $itemB] = $purchaseOrder->items;

    $this->actingAs($user)->patch(route('goods-receipt-notes.confirm', draftGoodsReceiptNoteFor($itemA, 10)), [
        'received_by_id' => Workforce::factory()->create()->id,
    ])->assertSessionHasNoErrors();

    expect($purchaseOrder->refresh()->progress)->toBe('partially_received');

    $this->actingAs($user)->patch(route('goods-receipt-notes.confirm', draftGoodsReceiptNoteFor($itemB, 5)), [
        'received_by_id' => Workforce::factory()->create()->id,
    ])->assertSessionHasNoErrors();

    expect($purchaseOrder->refresh()->progress)->toBe('fully_received');
});

test('progress derivation compares per line item, not an aggregate total', function () {
    $user = User::factory()->create();
    $purchaseOrder = purchaseOrderWithItemQuantities([5, 5]);
    [$itemA, $itemB] = $purchaseOrder->items;

    // Item A is over-received to 10 (double its order); item B never arrives.
    // An aggregate sum (10 accepted / 10 ordered) would wrongly read as fully received.
    $goodsReceiptNote = draftGoodsReceiptNoteFor($itemA, 10);

    $this->actingAs($user)->patch(route('goods-receipt-notes.confirm', $goodsReceiptNote), [
        'received_by_id' => Workforce::factory()->create()->id,
    ])->assertSessionHasNoErrors();

    expect($purchaseOrder->refresh()->progress)->toBe('partially_received');
});

test('a draft goods receipt note does not affect the purchase order progress until confirmed', function () {
    $purchaseOrder = purchaseOrderWithItemQuantities([10]);
    $item = $purchaseOrder->items->first();
    draftGoodsReceiptNoteFor($item, 10);

    expect($purchaseOrder->refresh()->progress)->toBeNull();
});

test('goods receipt note cannot be confirmed once the purchase order is no longer approved', function () {
    $user = User::factory()->create();
    $purchaseOrder = purchaseOrderWithItemQuantities([10]);
    $item = $purchaseOrder->items->first();
    $goodsReceiptNote = draftGoodsReceiptNoteFor($item, 4);

    $purchaseOrder->update(['status' => 'draft']);

    $this->actingAs($user)
        ->patch(route('goods-receipt-notes.confirm', $goodsReceiptNote), [
            'received_by_id' => Workforce::factory()->create()->id,
        ])
        ->assertForbidden();

    expect($goodsReceiptNote->refresh()->status)->toBe('draft');
});

test('a confirmed goods receipt note cannot be confirmed again', function () {
    $user = User::factory()->create();
    $purchaseOrder = purchaseOrderWithItemQuantities([10]);
    $item = $purchaseOrder->items->first();
    $goodsReceiptNote = draftGoodsReceiptNoteFor($item, 4);
    $goodsReceiptNote->update(['status' => 'confirmed']);

    $this->actingAs($user)
        ->patch(route('goods-receipt-notes.confirm', $goodsReceiptNote), [
            'received_by_id' => Workforce::factory()->create()->id,
        ])
        ->assertForbidden();
});

test('guests cannot confirm goods receipt notes', function () {
    $purchaseOrder = purchaseOrderWithItemQuantities([10]);
    $item = $purchaseOrder->items->first();
    $goodsReceiptNote = draftGoodsReceiptNoteFor($item, 4);

    $this->patch(route('goods-receipt-notes.confirm', $goodsReceiptNote), [])
        ->assertRedirect(route('login'));
});
