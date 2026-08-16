<?php

use App\Models\GoodsReceiptNote;
use App\Models\Product;
use App\Models\PurchaseOrder;
use App\Models\StockMovement;
use App\Models\User;

/**
 * Build a confirmed GRN with stock movements already created, mirroring what
 * GoodsReceiptNoteController::confirm() does, without going through the HTTP layer.
 *
 * @param  array<int, float>  $acceptedQuantities
 * @return array{grn: GoodsReceiptNote, purchaseOrder: PurchaseOrder}
 */
function confirmedGrn(array $acceptedQuantities): array
{
    $purchaseOrder = PurchaseOrder::factory()->create(['status' => 'approved']);

    $items = [];
    foreach ($acceptedQuantities as $qty) {
        $items[] = $purchaseOrder->items()->create([
            'product_id' => Product::factory()->create(['type' => 'goods'])->id,
            'quantity' => $qty,
            'unit' => 'Pcs',
            'unit_price' => 1_000,
            'total' => $qty * 1_000,
        ]);
    }

    $grn = GoodsReceiptNote::factory()->create([
        'purchase_order_id' => $purchaseOrder->id,
        'status' => 'confirmed',
        'received_date' => '2026-01-15',
    ]);

    foreach ($items as $poItem) {
        $grnItem = $grn->items()->create([
            'product_id' => $poItem->product_id,
            'purchase_order_item_id' => $poItem->id,
            'quantity_ordered' => $poItem->quantity,
            'unit' => $poItem->unit,
            'quantity_accepted' => $poItem->quantity,
            'quantity_rejected' => 0,
        ]);

        StockMovement::create([
            'product_id' => $poItem->product_id,
            'type' => 'in',
            'quantity' => $poItem->quantity,
            'movement_date' => '2026-01-15',
            'goods_receipt_note_item_id' => $grnItem->id,
        ]);
    }

    return ['grn' => $grn, 'purchaseOrder' => $purchaseOrder->fresh('items')];
}

test('cancelling a confirmed grn deletes its stock movements and persists a reason', function () {
    $user = User::factory()->create();
    ['grn' => $grn] = confirmedGrn([10]);

    expect(StockMovement::count())->toBe(1);

    $this->actingAs($user)
        ->patch(route('goods-receipt-notes.cancel', $grn), ['cancel_reason' => 'Goods were damaged on arrival.'])
        ->assertSessionHasNoErrors();

    $grn->refresh();
    expect($grn->status)->toBe('cancelled');
    expect($grn->cancel_reason)->toBe('Goods were damaged on arrival.');
    expect(StockMovement::count())->toBe(0);
});

test('cancelling a grn without a reason fails validation', function () {
    $user = User::factory()->create();
    ['grn' => $grn] = confirmedGrn([10]);

    $this->actingAs($user)
        ->patch(route('goods-receipt-notes.cancel', $grn), [])
        ->assertSessionHasErrors(['cancel_reason']);

    expect($grn->refresh()->status)->toBe('confirmed');
});

test('cancelling the only confirmed grn rolls purchase order progress back to sent', function () {
    $user = User::factory()->create();
    ['grn' => $grn, 'purchaseOrder' => $purchaseOrder] = confirmedGrn([10]);
    $purchaseOrder->update(['progress' => 'fully_received']);

    $this->actingAs($user)
        ->patch(route('goods-receipt-notes.cancel', $grn), ['cancel_reason' => 'Wrong quantity delivered.'])
        ->assertSessionHasNoErrors();

    expect($purchaseOrder->refresh()->progress)->toBe('sent');
});

test('cancelling one of two confirmed grns recomputes purchase order progress without full reset', function () {
    $user = User::factory()->create();
    $purchaseOrder = PurchaseOrder::factory()->create(['status' => 'approved']);

    $poItemA = $purchaseOrder->items()->create([
        'product_id' => Product::factory()->create(['type' => 'goods'])->id,
        'quantity' => 10,
        'unit' => 'Pcs',
        'unit_price' => 1_000,
        'total' => 10_000,
    ]);
    $poItemB = $purchaseOrder->items()->create([
        'product_id' => Product::factory()->create(['type' => 'goods'])->id,
        'quantity' => 5,
        'unit' => 'Pcs',
        'unit_price' => 1_000,
        'total' => 5_000,
    ]);

    $grnA = GoodsReceiptNote::factory()->create([
        'purchase_order_id' => $purchaseOrder->id,
        'status' => 'confirmed',
        'received_date' => '2026-01-15',
    ]);
    $grnItemA = $grnA->items()->create([
        'product_id' => $poItemA->product_id,
        'purchase_order_item_id' => $poItemA->id,
        'quantity_ordered' => 10,
        'unit' => 'Pcs',
        'quantity_accepted' => 10,
        'quantity_rejected' => 0,
    ]);
    StockMovement::create([
        'product_id' => $poItemA->product_id,
        'type' => 'in',
        'quantity' => 10,
        'movement_date' => '2026-01-15',
        'goods_receipt_note_item_id' => $grnItemA->id,
    ]);

    $grnB = GoodsReceiptNote::factory()->create([
        'purchase_order_id' => $purchaseOrder->id,
        'status' => 'confirmed',
        'received_date' => '2026-01-16',
    ]);
    $grnItemB = $grnB->items()->create([
        'product_id' => $poItemB->product_id,
        'purchase_order_item_id' => $poItemB->id,
        'quantity_ordered' => 5,
        'unit' => 'Pcs',
        'quantity_accepted' => 5,
        'quantity_rejected' => 0,
    ]);
    StockMovement::create([
        'product_id' => $poItemB->product_id,
        'type' => 'in',
        'quantity' => 5,
        'movement_date' => '2026-01-16',
        'goods_receipt_note_item_id' => $grnItemB->id,
    ]);

    $purchaseOrder->update(['progress' => 'fully_received']);

    // Cancel GRN B — item B no longer received → drops to partially_received
    $this->actingAs($user)
        ->patch(route('goods-receipt-notes.cancel', $grnB), ['cancel_reason' => 'Item B was returned to vendor.'])
        ->assertSessionHasNoErrors();

    expect($purchaseOrder->refresh()->progress)->toBe('partially_received');
    expect(StockMovement::count())->toBe(1);
});

test('a draft grn cannot be cancelled', function () {
    $user = User::factory()->create();
    $grn = GoodsReceiptNote::factory()->create(['status' => 'draft']);

    $this->actingAs($user)
        ->patch(route('goods-receipt-notes.cancel', $grn))
        ->assertForbidden();
});

test('guests cannot cancel a grn', function () {
    $grn = GoodsReceiptNote::factory()->create(['status' => 'confirmed']);

    $this->patch(route('goods-receipt-notes.cancel', $grn))
        ->assertRedirect(route('login'));
});
