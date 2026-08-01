<?php

use App\Models\PurchaseOrder;
use App\Models\User;
use App\Models\Workforce;

test('either checker slot can be signed off on an issued purchase order', function () {
    $user = User::factory()->create();
    $purchaseOrder = PurchaseOrder::factory()->create(['status' => 'issued']);
    $checker = Workforce::factory()->create();

    $this->actingAs($user)
        ->patch(route('purchase-orders.check', $purchaseOrder), ['slot' => 2, 'checked_by_id' => $checker->id])
        ->assertSessionHasNoErrors()
        ->assertRedirect(route('purchase-orders.show', $purchaseOrder));

    $purchaseOrder->refresh();
    expect($purchaseOrder->checked_by_1_id)->toBeNull();
    expect($purchaseOrder->checked_by_2_id)->toBe($checker->id);
    expect($purchaseOrder->checked_by_2_at)->not->toBeNull();
});

test('a slot that is already signed off cannot be checked again', function () {
    $user = User::factory()->create();
    $firstChecker = Workforce::factory()->create();
    $secondChecker = Workforce::factory()->create();
    $purchaseOrder = PurchaseOrder::factory()->create([
        'status' => 'issued',
        'checked_by_1_id' => $firstChecker->id,
        'checked_by_1_at' => now(),
    ]);

    $this->actingAs($user)
        ->patch(route('purchase-orders.check', $purchaseOrder), ['slot' => 1, 'checked_by_id' => $secondChecker->id])
        ->assertForbidden();
});

test('a purchase order that is not issued cannot be checked', function () {
    $user = User::factory()->create();
    $purchaseOrder = PurchaseOrder::factory()->create(['status' => 'draft']);
    $checker = Workforce::factory()->create();

    $this->actingAs($user)
        ->patch(route('purchase-orders.check', $purchaseOrder), ['slot' => 1, 'checked_by_id' => $checker->id])
        ->assertForbidden();
});

test('guests cannot check purchase orders', function () {
    $purchaseOrder = PurchaseOrder::factory()->create();

    $this->patch(route('purchase-orders.check', $purchaseOrder), [])
        ->assertRedirect(route('login'));
});
