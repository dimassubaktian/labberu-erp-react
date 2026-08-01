<?php

use App\Models\Product;
use App\Models\PurchaseOrder;
use App\Models\User;

test('an approved purchase order can be marked as sent', function () {
    $user = User::factory()->create();
    $purchaseOrder = PurchaseOrder::factory()->create(['status' => 'approved']);

    $response = $this->actingAs($user)
        ->patch(route('purchase-orders.progress.update', $purchaseOrder), ['progress' => 'sent']);

    $response->assertSessionHasNoErrors();
    $response->assertRedirect(route('purchase-orders.show', $purchaseOrder));

    expect($purchaseOrder->refresh()->progress)->toBe('sent');
});

test('progress can go straight from sent to fully received', function () {
    $user = User::factory()->create();
    $purchaseOrder = PurchaseOrder::factory()->create(['status' => 'approved', 'progress' => 'sent']);

    $this->actingAs($user)
        ->patch(route('purchase-orders.progress.update', $purchaseOrder), ['progress' => 'fully_received'])
        ->assertSessionHasNoErrors();

    expect($purchaseOrder->refresh()->progress)->toBe('fully_received');
});

test('progress advances from sent to partially received to fully received to closed', function () {
    $user = User::factory()->create();
    $purchaseOrder = PurchaseOrder::factory()->create(['status' => 'approved', 'progress' => 'sent']);

    $this->actingAs($user)
        ->patch(route('purchase-orders.progress.update', $purchaseOrder), ['progress' => 'partially_received'])
        ->assertSessionHasNoErrors();
    expect($purchaseOrder->refresh()->progress)->toBe('partially_received');

    $this->actingAs($user)
        ->patch(route('purchase-orders.progress.update', $purchaseOrder), ['progress' => 'fully_received'])
        ->assertSessionHasNoErrors();
    expect($purchaseOrder->refresh()->progress)->toBe('fully_received');

    $this->actingAs($user)
        ->patch(route('purchase-orders.progress.update', $purchaseOrder), ['progress' => 'closed'])
        ->assertSessionHasNoErrors();
    expect($purchaseOrder->refresh()->progress)->toBe('closed');
});

test('progress stages cannot be skipped', function () {
    $user = User::factory()->create();
    $purchaseOrder = PurchaseOrder::factory()->create(['status' => 'approved']);

    $this->actingAs($user)
        ->patch(route('purchase-orders.progress.update', $purchaseOrder), ['progress' => 'closed'])
        ->assertSessionHasErrors(['progress']);

    expect($purchaseOrder->refresh()->progress)->toBeNull();
});

test('progress cannot be set unless the purchase order is approved', function () {
    $user = User::factory()->create();
    $purchaseOrder = PurchaseOrder::factory()->create(['status' => 'draft']);

    $this->actingAs($user)
        ->patch(route('purchase-orders.progress.update', $purchaseOrder), ['progress' => 'sent'])
        ->assertSessionHasErrors(['progress']);

    expect($purchaseOrder->refresh()->progress)->toBeNull();
});

test('closed progress has no further transitions', function () {
    $user = User::factory()->create();
    $purchaseOrder = PurchaseOrder::factory()->create(['status' => 'approved', 'progress' => 'closed']);

    $this->actingAs($user)
        ->patch(route('purchase-orders.progress.update', $purchaseOrder), ['progress' => 'sent'])
        ->assertSessionHasErrors(['progress']);
});

test('editing an approved purchase order back to draft clears its progress', function () {
    $user = User::factory()->create();
    $purchaseOrder = PurchaseOrder::factory()->create([
        'status' => 'approved',
        'progress' => 'sent',
    ]);
    $product = Product::factory()->create();

    $this->actingAs($user)->put(route('purchase-orders.update', $purchaseOrder), [
        'project_id' => $purchaseOrder->project_id,
        'quotation_id' => $purchaseOrder->quotation_id,
        'customer_id' => $purchaseOrder->customer_id,
        'vendor_id' => $purchaseOrder->vendor_id,
        'project_name' => $purchaseOrder->project_name,
        'date' => now()->toDateString(),
        'currency_id' => $purchaseOrder->currency_id,
        'items' => [
            ['product_id' => $product->id, 'quantity' => 1, 'unit' => 'Pcs', 'unit_price' => 1000],
        ],
    ]);

    expect($purchaseOrder->refresh()->progress)->toBeNull();
});

test('guests cannot update purchase order progress', function () {
    $purchaseOrder = PurchaseOrder::factory()->create(['status' => 'approved']);

    $this->patch(route('purchase-orders.progress.update', $purchaseOrder), ['progress' => 'sent'])
        ->assertRedirect(route('login'));
});
