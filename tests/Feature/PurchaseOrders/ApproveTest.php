<?php

use App\Models\PurchaseOrder;
use App\Models\User;
use App\Models\Workforce;

test('a purchase order checked by both checkers can be approved', function () {
    $user = User::factory()->create();
    $approver = Workforce::factory()->create();
    $purchaseOrder = PurchaseOrder::factory()->create([
        'status' => 'issued',
        'checked_by_1_id' => Workforce::factory()->create()->id,
        'checked_by_1_at' => now(),
        'checked_by_2_id' => Workforce::factory()->create()->id,
        'checked_by_2_at' => now(),
    ]);

    $this->actingAs($user)
        ->patch(route('purchase-orders.approve', $purchaseOrder), ['approved_by_id' => $approver->id])
        ->assertSessionHasNoErrors()
        ->assertRedirect(route('purchase-orders.show', $purchaseOrder));

    $purchaseOrder->refresh();
    expect($purchaseOrder->status)->toBe('approved');
    expect($purchaseOrder->approved_by_id)->toBe($approver->id);
    expect($purchaseOrder->approved_at)->not->toBeNull();
});

test('a purchase order missing a checker cannot be approved', function () {
    $user = User::factory()->create();
    $approver = Workforce::factory()->create();
    $purchaseOrder = PurchaseOrder::factory()->create([
        'status' => 'issued',
        'checked_by_1_id' => Workforce::factory()->create()->id,
        'checked_by_1_at' => now(),
        'checked_by_2_id' => null,
    ]);

    $this->actingAs($user)
        ->patch(route('purchase-orders.approve', $purchaseOrder), ['approved_by_id' => $approver->id])
        ->assertForbidden();
});

test('guests cannot approve purchase orders', function () {
    $purchaseOrder = PurchaseOrder::factory()->create();

    $this->patch(route('purchase-orders.approve', $purchaseOrder), [])
        ->assertRedirect(route('login'));
});
