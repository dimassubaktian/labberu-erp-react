<?php

use App\Models\DeliveryOrder;
use App\Models\User;
use Inertia\Testing\AssertableInertia as Assert;

test('draft delivery order edit page is displayed', function () {
    $user = User::factory()->create();
    $deliveryOrder = DeliveryOrder::factory()->create(['status' => 'draft']);

    $this->actingAs($user)
        ->get(route('delivery-orders.edit', $deliveryOrder))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('delivery-orders/edit'),
        );
});

test('confirmed delivery order cannot be edited', function () {
    $user = User::factory()->create();
    $deliveryOrder = DeliveryOrder::factory()->create(['status' => 'confirmed']);

    $this->actingAs($user)
        ->get(route('delivery-orders.edit', $deliveryOrder))
        ->assertForbidden();
});

test('guests cannot view the edit page', function () {
    $deliveryOrder = DeliveryOrder::factory()->create(['status' => 'draft']);

    $this->get(route('delivery-orders.edit', $deliveryOrder))
        ->assertRedirect(route('login'));
});
