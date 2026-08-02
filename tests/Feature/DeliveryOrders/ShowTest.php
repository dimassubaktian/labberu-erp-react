<?php

use App\Models\DeliveryOrder;
use App\Models\User;
use Inertia\Testing\AssertableInertia as Assert;

test('delivery order show page is displayed', function () {
    $user = User::factory()->create();
    $deliveryOrder = DeliveryOrder::factory()->create();

    $this->actingAs($user)
        ->get(route('delivery-orders.show', $deliveryOrder))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('delivery-orders/show')
            ->where('deliveryOrder.id', $deliveryOrder->id),
        );
});

test('guests cannot view a delivery order', function () {
    $deliveryOrder = DeliveryOrder::factory()->create();

    $this->get(route('delivery-orders.show', $deliveryOrder))
        ->assertRedirect(route('login'));
});
