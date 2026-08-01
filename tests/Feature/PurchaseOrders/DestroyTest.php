<?php

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
