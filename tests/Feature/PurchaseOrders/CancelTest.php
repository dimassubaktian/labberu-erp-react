<?php

use App\Models\GoodsReceiptNote;
use App\Models\PurchaseOrder;
use App\Models\User;

test('a draft purchase order can be cancelled with a reason', function () {
    $user = User::factory()->create();
    $purchaseOrder = PurchaseOrder::factory()->create(['status' => 'draft']);

    $this->actingAs($user)
        ->patch(route('purchase-orders.cancel', $purchaseOrder), ['cancel_reason' => 'No longer needed.'])
        ->assertRedirect(route('purchase-orders.show', $purchaseOrder));

    $purchaseOrder->refresh();
    expect($purchaseOrder->status)->toBe('cancelled');
    expect($purchaseOrder->cancel_reason)->toBe('No longer needed.');
});

test('cancelling a purchase order without a reason fails validation', function () {
    $user = User::factory()->create();
    $purchaseOrder = PurchaseOrder::factory()->create(['status' => 'draft']);

    $this->actingAs($user)
        ->patch(route('purchase-orders.cancel', $purchaseOrder), [])
        ->assertSessionHasErrors(['cancel_reason']);

    expect($purchaseOrder->refresh()->status)->toBe('draft');
});

test('a purchase order with a confirmed goods receipt note cannot be cancelled', function () {
    $user = User::factory()->create();
    $purchaseOrder = PurchaseOrder::factory()->create(['status' => 'draft']);
    GoodsReceiptNote::factory()->create(['purchase_order_id' => $purchaseOrder->id, 'status' => 'confirmed']);

    $this->actingAs($user)
        ->patch(route('purchase-orders.cancel', $purchaseOrder), ['cancel_reason' => 'No longer needed.'])
        ->assertForbidden();

    expect($purchaseOrder->refresh()->status)->toBe('draft');
});

test('cancelling a purchase order also cancels its draft goods receipt notes', function () {
    $user = User::factory()->create();
    $purchaseOrder = PurchaseOrder::factory()->create(['status' => 'draft']);
    $grn = GoodsReceiptNote::factory()->create(['purchase_order_id' => $purchaseOrder->id, 'status' => 'draft']);

    $this->actingAs($user)
        ->patch(route('purchase-orders.cancel', $purchaseOrder), ['cancel_reason' => 'No longer needed.'])
        ->assertRedirect(route('purchase-orders.show', $purchaseOrder));

    expect($purchaseOrder->refresh()->status)->toBe('cancelled');
    expect($grn->refresh()->status)->toBe('cancelled');
});

test('an issued purchase order can be cancelled', function () {
    $user = User::factory()->create();
    $purchaseOrder = PurchaseOrder::factory()->create(['status' => 'issued']);

    $this->actingAs($user)->patch(route('purchase-orders.cancel', $purchaseOrder), ['cancel_reason' => 'No longer needed.']);

    expect($purchaseOrder->refresh()->status)->toBe('cancelled');
});

test('an approved purchase order cannot be cancelled', function () {
    $user = User::factory()->create();
    $purchaseOrder = PurchaseOrder::factory()->create(['status' => 'approved']);

    $this->actingAs($user)
        ->patch(route('purchase-orders.cancel', $purchaseOrder), ['cancel_reason' => 'No longer needed.'])
        ->assertForbidden();
});

test('guests cannot cancel purchase orders', function () {
    $purchaseOrder = PurchaseOrder::factory()->create();

    $this->patch(route('purchase-orders.cancel', $purchaseOrder), [])
        ->assertRedirect(route('login'));
});
