<?php

use App\Models\GoodsReceiptNote;
use App\Models\Product;
use App\Models\PurchaseOrder;
use App\Models\PurchaseOrderItem;
use App\Models\StockMovement;
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

function workforceFor(User $user): Workforce
{
    return Workforce::factory()->create(['user_id' => $user->id]);
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
    $workforce = workforceFor($user);
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
    $workforce = workforceFor($user);
    $purchaseOrder = purchaseOrderWithItemQuantities([10, 5]);
    [$itemA, $itemB] = $purchaseOrder->items;

    $this->actingAs($user)->patch(route('goods-receipt-notes.confirm', draftGoodsReceiptNoteFor($itemA, 10)), [
        'received_by_id' => $workforce->id,
    ])->assertSessionHasNoErrors();

    expect($purchaseOrder->refresh()->progress)->toBe('partially_received');

    $this->actingAs($user)->patch(route('goods-receipt-notes.confirm', draftGoodsReceiptNoteFor($itemB, 5)), [
        'received_by_id' => $workforce->id,
    ])->assertSessionHasNoErrors();

    expect($purchaseOrder->refresh()->progress)->toBe('fully_received');
});

test('progress derivation compares per line item, not an aggregate total', function () {
    $user = User::factory()->create();
    $purchaseOrder = purchaseOrderWithItemQuantities([5, 5]);
    [$itemA, $itemB] = $purchaseOrder->items;

    // Item A is fully received (5/5); item B never arrives. An aggregate sum
    // (5 accepted / 10 ordered) reads as 50%, but per-line it's "one done, one untouched" —
    // this asserts the derivation actually walks each line rather than summing totals.
    $goodsReceiptNote = draftGoodsReceiptNoteFor($itemA, 5);

    $this->actingAs($user)->patch(route('goods-receipt-notes.confirm', $goodsReceiptNote), [
        'received_by_id' => workforceFor($user)->id,
    ])->assertSessionHasNoErrors();

    expect($purchaseOrder->refresh()->progress)->toBe('partially_received');
});

test('confirming a goods receipt note cannot accept more than remains on the purchase order line', function () {
    $user = User::factory()->create();
    $purchaseOrder = purchaseOrderWithItemQuantities([5]);
    $item = $purchaseOrder->items->first();

    // Bypasses store/update validation the way a direct DB write or a stale draft would,
    // so this exercises confirm() as the final backstop against over-accepting.
    $goodsReceiptNote = draftGoodsReceiptNoteFor($item, 10);

    $this->actingAs($user)->patch(route('goods-receipt-notes.confirm', $goodsReceiptNote), [
        'received_by_id' => workforceFor($user)->id,
    ])->assertSessionHasErrors(['items']);

    expect($goodsReceiptNote->refresh()->status)->toBe('draft');
    expect($purchaseOrder->refresh()->progress)->toBeNull();
});

test('two draft goods receipt notes that individually look valid cannot both over-accept once confirmed', function () {
    $user = User::factory()->create();
    $workforce = workforceFor($user);
    $purchaseOrder = purchaseOrderWithItemQuantities([10]);
    $item = $purchaseOrder->items->first();

    // Each draft alone is within the ordered quantity; "remaining" only counts confirmed
    // notes, so nothing stops both from being created. Confirming the first is fine.
    $firstNote = draftGoodsReceiptNoteFor($item, 8);
    $secondNote = draftGoodsReceiptNoteFor($item, 8);

    $this->actingAs($user)->patch(route('goods-receipt-notes.confirm', $firstNote), [
        'received_by_id' => $workforce->id,
    ])->assertSessionHasNoErrors();

    $this->actingAs($user)->patch(route('goods-receipt-notes.confirm', $secondNote), [
        'received_by_id' => $workforce->id,
    ])->assertSessionHasErrors(['items']);

    expect($secondNote->refresh()->status)->toBe('draft');
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
            'received_by_id' => workforceFor($user)->id,
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
            'received_by_id' => workforceFor($user)->id,
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

test('confirming a goods receipt note creates an in stock movement for each accepted, physical-goods line', function () {
    $user = User::factory()->create();
    $goodsProduct = Product::factory()->create(['type' => 'goods']);
    $serviceProduct = Product::factory()->create(['type' => 'service']);
    $purchaseOrder = PurchaseOrder::factory()->create(['status' => 'approved']);

    $goodsItem = $purchaseOrder->items()->create([
        'product_id' => $goodsProduct->id,
        'quantity' => 10,
        'unit' => 'Pcs',
        'unit_price' => 1_000,
        'total' => 10_000,
    ]);
    $serviceItem = $purchaseOrder->items()->create([
        'product_id' => $serviceProduct->id,
        'quantity' => 5,
        'unit' => 'Hours',
        'unit_price' => 1_000,
        'total' => 5_000,
    ]);

    $goodsReceiptNote = GoodsReceiptNote::factory()->create([
        'purchase_order_id' => $purchaseOrder->id,
        'status' => 'draft',
        'received_date' => '2026-01-15',
    ]);
    $goodsReceiptNote->items()->create([
        'product_id' => $goodsItem->product_id,
        'purchase_order_item_id' => $goodsItem->id,
        'quantity_ordered' => $goodsItem->quantity,
        'unit' => $goodsItem->unit,
        'quantity_accepted' => 6,
        'quantity_rejected' => 2,
    ]);
    $goodsReceiptNote->items()->create([
        'product_id' => $serviceItem->product_id,
        'purchase_order_item_id' => $serviceItem->id,
        'quantity_ordered' => $serviceItem->quantity,
        'unit' => $serviceItem->unit,
        'quantity_accepted' => 5,
    ]);

    $this->actingAs($user)->patch(route('goods-receipt-notes.confirm', $goodsReceiptNote), [
        'received_by_id' => workforceFor($user)->id,
    ])->assertSessionHasNoErrors();

    $movement = StockMovement::sole();
    expect($movement->product_id)->toBe($goodsProduct->id);
    expect($movement->type)->toBe('in');
    expect((float) $movement->quantity)->toBe(6.0);
    expect($movement->movement_date->toDateString())->toBe('2026-01-15');
});

test('a fully-rejected goods receipt note line creates no stock movement', function () {
    $user = User::factory()->create();
    $goodsProduct = Product::factory()->create(['type' => 'goods']);
    $purchaseOrder = PurchaseOrder::factory()->create(['status' => 'approved']);
    $item = $purchaseOrder->items()->create([
        'product_id' => $goodsProduct->id,
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
        'quantity_accepted' => 0,
        'quantity_rejected' => 10,
    ]);

    $this->actingAs($user)->patch(route('goods-receipt-notes.confirm', $goodsReceiptNote), [
        'received_by_id' => workforceFor($user)->id,
    ])->assertSessionHasNoErrors();

    expect(StockMovement::count())->toBe(0);
});
