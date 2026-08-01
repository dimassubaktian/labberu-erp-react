<?php

use App\Models\PurchaseOrder;
use App\Models\User;
use Inertia\Testing\AssertableInertia as Assert;

test('purchase orders index page is displayed', function () {
    $user = User::factory()->create();
    PurchaseOrder::factory()->create();
    PurchaseOrder::factory()->create();

    $this->actingAs($user)
        ->get(route('purchase-orders.index'))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('purchase-orders/index')
            ->has('purchaseOrders.data', 2),
        );
});

test('trashed purchase orders are not listed', function () {
    $user = User::factory()->create();
    PurchaseOrder::factory()->create();
    PurchaseOrder::factory()->create()->delete();

    $this->actingAs($user)
        ->get(route('purchase-orders.index'))
        ->assertInertia(fn (Assert $page) => $page
            ->has('purchaseOrders.data', 1),
        );
});

test('guests cannot view purchase orders', function () {
    $this->get(route('purchase-orders.index'))
        ->assertRedirect(route('login'));
});
