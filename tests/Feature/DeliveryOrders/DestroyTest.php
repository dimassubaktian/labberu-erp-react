<?php

use App\Models\DeliveryOrder;
use App\Models\User;

test('draft delivery order can be deleted', function () {
    $user = User::factory()->create();
    $deliveryOrder = DeliveryOrder::factory()->create(['status' => 'draft']);

    $response = $this->actingAs($user)->delete(route('delivery-orders.destroy', $deliveryOrder));

    $response->assertRedirect(route('delivery-orders.index'));
    expect(DeliveryOrder::find($deliveryOrder->id))->toBeNull();
});

test('confirmed delivery order cannot be deleted', function () {
    $user = User::factory()->create();
    $deliveryOrder = DeliveryOrder::factory()->create(['status' => 'confirmed']);

    $this->actingAs($user)
        ->delete(route('delivery-orders.destroy', $deliveryOrder))
        ->assertForbidden();

    expect(DeliveryOrder::find($deliveryOrder->id))->not->toBeNull();
});

test('guests cannot delete delivery orders', function () {
    $deliveryOrder = DeliveryOrder::factory()->create();

    $this->delete(route('delivery-orders.destroy', $deliveryOrder))
        ->assertRedirect(route('login'));
});
