<?php

use App\Models\PurchaseOrder;
use App\Models\User;
use Inertia\Testing\AssertableInertia as Assert;

test('purchase order show page is displayed', function () {
    $user = User::factory()->create();
    $purchaseOrder = PurchaseOrder::factory()->create();

    $this->actingAs($user)
        ->get(route('purchase-orders.show', $purchaseOrder))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('purchase-orders/show')
            ->where('purchaseOrder.id', $purchaseOrder->id),
        );
});

test('guests cannot view a purchase order', function () {
    $purchaseOrder = PurchaseOrder::factory()->create();

    $this->get(route('purchase-orders.show', $purchaseOrder))
        ->assertRedirect(route('login'));
});
