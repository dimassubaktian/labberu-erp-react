<?php

use App\Models\PurchaseOrder;
use App\Models\User;
use App\Models\Workforce;

test('an issued purchase order can be rejected, reverting it to draft and clearing sign-offs', function () {
    $user = User::factory()->create();
    $purchaseOrder = PurchaseOrder::factory()->create([
        'status' => 'issued',
        'issued_by_id' => Workforce::factory()->create()->id,
        'issued_at' => now(),
        'checked_by_1_id' => Workforce::factory()->create()->id,
        'checked_by_1_at' => now(),
    ]);

    $this->actingAs($user)
        ->patch(route('purchase-orders.reject', $purchaseOrder), ['rejection_reason' => 'Pricing needs revision'])
        ->assertSessionHasNoErrors()
        ->assertRedirect(route('purchase-orders.show', $purchaseOrder));

    $purchaseOrder->refresh();
    expect($purchaseOrder->status)->toBe('draft');
    expect($purchaseOrder->issued_by_id)->toBeNull();
    expect($purchaseOrder->issued_at)->toBeNull();
    expect($purchaseOrder->checked_by_1_id)->toBeNull();
    expect($purchaseOrder->rejection_reason)->toBe('Pricing needs revision');
});

test('a draft purchase order cannot be rejected', function () {
    $user = User::factory()->create();
    $purchaseOrder = PurchaseOrder::factory()->create(['status' => 'draft']);

    $this->actingAs($user)
        ->patch(route('purchase-orders.reject', $purchaseOrder), ['rejection_reason' => 'Not applicable'])
        ->assertForbidden();
});

test('a rejection reason is required', function () {
    $user = User::factory()->create();
    $purchaseOrder = PurchaseOrder::factory()->create(['status' => 'issued']);

    $this->actingAs($user)
        ->patch(route('purchase-orders.reject', $purchaseOrder), [])
        ->assertSessionHasErrors(['rejection_reason']);
});

test('guests cannot reject purchase orders', function () {
    $purchaseOrder = PurchaseOrder::factory()->create(['status' => 'issued']);

    $this->patch(route('purchase-orders.reject', $purchaseOrder), [])
        ->assertRedirect(route('login'));
});
