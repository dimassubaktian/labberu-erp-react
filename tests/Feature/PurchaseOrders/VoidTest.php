<?php

use App\Models\PurchaseOrder;
use App\Models\User;

test('an approved purchase order can be voided with a reason', function () {
    $user = User::factory()->create();
    $purchaseOrder = PurchaseOrder::factory()->create(['status' => 'approved']);

    $this->actingAs($user)
        ->patch(route('purchase-orders.void', $purchaseOrder), ['void_reason' => 'Vendor could no longer fulfil the order.'])
        ->assertRedirect(route('purchase-orders.show', $purchaseOrder));

    $purchaseOrder->refresh();
    expect($purchaseOrder->status)->toBe('voided');
    expect($purchaseOrder->void_reason)->toBe('Vendor could no longer fulfil the order.');
});

test('voiding a purchase order without a reason fails validation', function () {
    $user = User::factory()->create();
    $purchaseOrder = PurchaseOrder::factory()->create(['status' => 'approved']);

    $this->actingAs($user)
        ->patch(route('purchase-orders.void', $purchaseOrder), [])
        ->assertSessionHasErrors(['void_reason']);

    expect($purchaseOrder->refresh()->status)->toBe('approved');
});

test('a draft purchase order cannot be voided', function () {
    $user = User::factory()->create();
    $purchaseOrder = PurchaseOrder::factory()->create(['status' => 'draft']);

    $this->actingAs($user)
        ->patch(route('purchase-orders.void', $purchaseOrder), ['void_reason' => 'Not applicable.'])
        ->assertForbidden();
});

test('guests cannot void purchase orders', function () {
    $purchaseOrder = PurchaseOrder::factory()->create(['status' => 'approved']);

    $this->patch(route('purchase-orders.void', $purchaseOrder), [])
        ->assertRedirect(route('login'));
});
