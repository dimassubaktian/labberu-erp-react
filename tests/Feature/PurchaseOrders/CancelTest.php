<?php

use App\Models\PurchaseOrder;
use App\Models\User;

test('a draft purchase order can be cancelled', function () {
    $user = User::factory()->create();
    $purchaseOrder = PurchaseOrder::factory()->create(['status' => 'draft']);

    $this->actingAs($user)
        ->patch(route('purchase-orders.cancel', $purchaseOrder), [])
        ->assertRedirect(route('purchase-orders.show', $purchaseOrder));

    expect($purchaseOrder->refresh()->status)->toBe('cancelled');
});

test('an issued purchase order can be cancelled', function () {
    $user = User::factory()->create();
    $purchaseOrder = PurchaseOrder::factory()->create(['status' => 'issued']);

    $this->actingAs($user)->patch(route('purchase-orders.cancel', $purchaseOrder), []);

    expect($purchaseOrder->refresh()->status)->toBe('cancelled');
});

test('an approved purchase order cannot be cancelled', function () {
    $user = User::factory()->create();
    $purchaseOrder = PurchaseOrder::factory()->create(['status' => 'approved']);

    $this->actingAs($user)
        ->patch(route('purchase-orders.cancel', $purchaseOrder), [])
        ->assertForbidden();
});

test('guests cannot cancel purchase orders', function () {
    $purchaseOrder = PurchaseOrder::factory()->create();

    $this->patch(route('purchase-orders.cancel', $purchaseOrder), [])
        ->assertRedirect(route('login'));
});
