<?php

use App\Models\GoodsReceiptNote;
use App\Models\PurchaseOrder;
use App\Models\User;

test('draft purchase order can be deleted', function () {
    $user = User::factory()->create();
    $purchaseOrder = PurchaseOrder::factory()->create(['status' => 'draft']);

    $this->actingAs($user)
        ->delete(route('purchase-orders.destroy', $purchaseOrder))
        ->assertRedirect(route('purchase-orders.index'));

    expect(PurchaseOrder::find($purchaseOrder->id))->toBeNull();
});

test('a draft purchase order with a confirmed goods receipt note cannot be deleted', function () {
    $user = User::factory()->create();
    $purchaseOrder = PurchaseOrder::factory()->create(['status' => 'draft']);
    $grn = GoodsReceiptNote::factory()->create(['purchase_order_id' => $purchaseOrder->id, 'status' => 'confirmed']);

    $this->actingAs($user)
        ->delete(route('purchase-orders.destroy', $purchaseOrder))
        ->assertForbidden();

    expect(PurchaseOrder::find($purchaseOrder->id))->not->toBeNull();
    expect(GoodsReceiptNote::find($grn->id))->not->toBeNull();
});

test('deleting a purchase order also deletes its draft goods receipt notes', function () {
    $user = User::factory()->create();
    $purchaseOrder = PurchaseOrder::factory()->create(['status' => 'draft']);
    $grn = GoodsReceiptNote::factory()->create(['purchase_order_id' => $purchaseOrder->id, 'status' => 'draft']);

    $this->actingAs($user)
        ->delete(route('purchase-orders.destroy', $purchaseOrder))
        ->assertRedirect(route('purchase-orders.index'));

    expect(PurchaseOrder::find($purchaseOrder->id))->toBeNull();
    expect(GoodsReceiptNote::find($grn->id))->toBeNull();
});

test('non-draft purchase orders cannot be deleted', function () {
    $user = User::factory()->create();
    $purchaseOrder = PurchaseOrder::factory()->create(['status' => 'issued']);

    $this->actingAs($user)
        ->delete(route('purchase-orders.destroy', $purchaseOrder))
        ->assertForbidden();

    expect(PurchaseOrder::find($purchaseOrder->id))->not->toBeNull();
});

test('guests cannot delete purchase orders', function () {
    $purchaseOrder = PurchaseOrder::factory()->create();

    $this->delete(route('purchase-orders.destroy', $purchaseOrder))
        ->assertRedirect(route('login'));
});
