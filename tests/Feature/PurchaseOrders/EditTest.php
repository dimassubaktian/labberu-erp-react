<?php

use App\Models\PurchaseOrder;
use App\Models\User;
use Inertia\Testing\AssertableInertia as Assert;

test('draft purchase order edit page is displayed', function () {
    $user = User::factory()->create();
    $purchaseOrder = PurchaseOrder::factory()->create(['status' => 'draft']);

    $this->actingAs($user)
        ->get(route('purchase-orders.edit', $purchaseOrder))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('purchase-orders/edit')
            ->where('purchaseOrder.id', $purchaseOrder->id),
        );
});

test('approved purchase order edit page is displayed', function () {
    $user = User::factory()->create();
    $purchaseOrder = PurchaseOrder::factory()->create(['status' => 'approved']);

    $this->actingAs($user)
        ->get(route('purchase-orders.edit', $purchaseOrder))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('purchase-orders/edit')
            ->where('purchaseOrder.id', $purchaseOrder->id),
        );
});

test('non-draft, non-approved purchase orders cannot be edited', function () {
    $user = User::factory()->create();
    $purchaseOrder = PurchaseOrder::factory()->create(['status' => 'issued']);

    $this->actingAs($user)
        ->get(route('purchase-orders.edit', $purchaseOrder))
        ->assertForbidden();
});

test('guests cannot view the purchase order edit page', function () {
    $purchaseOrder = PurchaseOrder::factory()->create();

    $this->get(route('purchase-orders.edit', $purchaseOrder))
        ->assertRedirect(route('login'));
});
