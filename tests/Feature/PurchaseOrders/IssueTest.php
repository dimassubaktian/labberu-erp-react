<?php

use App\Models\PurchaseOrder;
use App\Models\User;
use App\Models\Workforce;

test('draft purchase order can be issued', function () {
    $user = User::factory()->create();
    $purchaseOrder = PurchaseOrder::factory()->create(['status' => 'draft']);
    $issuer = Workforce::factory()->create();

    $this->actingAs($user)
        ->patch(route('purchase-orders.issue', $purchaseOrder), ['issued_by_id' => $issuer->id])
        ->assertSessionHasNoErrors()
        ->assertRedirect(route('purchase-orders.show', $purchaseOrder));

    $purchaseOrder->refresh();
    expect($purchaseOrder->status)->toBe('issued');
    expect($purchaseOrder->issued_by_id)->toBe($issuer->id);
    expect($purchaseOrder->issued_at)->not->toBeNull();
});

test('a non-draft purchase order cannot be issued', function () {
    $user = User::factory()->create();
    $purchaseOrder = PurchaseOrder::factory()->create(['status' => 'issued']);
    $issuer = Workforce::factory()->create();

    $this->actingAs($user)
        ->patch(route('purchase-orders.issue', $purchaseOrder), ['issued_by_id' => $issuer->id])
        ->assertForbidden();
});

test('guests cannot issue purchase orders', function () {
    $purchaseOrder = PurchaseOrder::factory()->create();

    $this->patch(route('purchase-orders.issue', $purchaseOrder), [])
        ->assertRedirect(route('login'));
});
