<?php

use App\Models\PurchaseOrder;
use App\Models\User;

test('an approved purchase order can be voided', function () {
    $user = User::factory()->create();
    $purchaseOrder = PurchaseOrder::factory()->create(['status' => 'approved']);

    $this->actingAs($user)
        ->patch(route('purchase-orders.void', $purchaseOrder), [])
        ->assertRedirect(route('purchase-orders.show', $purchaseOrder));

    expect($purchaseOrder->refresh()->status)->toBe('voided');
});

test('a draft purchase order cannot be voided', function () {
    $user = User::factory()->create();
    $purchaseOrder = PurchaseOrder::factory()->create(['status' => 'draft']);

    $this->actingAs($user)
        ->patch(route('purchase-orders.void', $purchaseOrder), [])
        ->assertForbidden();
});

test('guests cannot void purchase orders', function () {
    $purchaseOrder = PurchaseOrder::factory()->create(['status' => 'approved']);

    $this->patch(route('purchase-orders.void', $purchaseOrder), [])
        ->assertRedirect(route('login'));
});
