<?php

use App\Models\DeliveryOrder;
use App\Models\Product;
use App\Models\Quotation;
use App\Models\User;

function quotationWithItem(): Quotation
{
    $quotation = Quotation::factory()->create(['status' => 'approved']);

    $quotation->items()->create([
        'product_id' => Product::factory()->create()->id,
        'quantity' => 10,
        'unit' => 'Pcs',
        'unit_price' => 1_000,
        'unit_cost' => 500,
        'total_price' => 10_000,
        'total_cost' => 5_000,
        'margin' => 5_000,
        'margin_percent' => 50,
    ]);

    return $quotation->fresh('items');
}

test('draft delivery order can be updated', function () {
    $user = User::factory()->create();
    $quotation = quotationWithItem();
    $item = $quotation->items->first();
    $deliveryOrder = DeliveryOrder::factory()->create([
        'quotation_id' => $quotation->id,
        'status' => 'draft',
    ]);

    $response = $this->actingAs($user)->put(route('delivery-orders.update', $deliveryOrder), [
        'quotation_id' => $quotation->id,
        'delivery_date' => now()->toDateString(),
        'remarks' => 'Updated remarks',
        'items' => [
            ['quotation_item_id' => $item->id, 'quantity_delivered' => 4],
        ],
    ]);

    $response->assertSessionHasNoErrors();
    $response->assertRedirect(route('delivery-orders.show', $deliveryOrder));

    $deliveryOrder->refresh();
    expect($deliveryOrder->remarks)->toBe('Updated remarks');
    expect($deliveryOrder->items()->count())->toBe(1);
    expect((float) $deliveryOrder->items()->sole()->quantity_delivered)->toBe(4.0);
});

test('the quotation cannot be changed once a delivery order is created', function () {
    $user = User::factory()->create();
    $quotation = quotationWithItem();
    $otherQuotation = quotationWithItem();
    $item = $quotation->items->first();
    $deliveryOrder = DeliveryOrder::factory()->create([
        'quotation_id' => $quotation->id,
        'status' => 'draft',
    ]);

    $this->actingAs($user)->put(route('delivery-orders.update', $deliveryOrder), [
        'quotation_id' => $otherQuotation->id,
        'delivery_date' => now()->toDateString(),
        'items' => [
            ['quotation_item_id' => $item->id, 'quantity_delivered' => 1],
        ],
    ])->assertSessionHasErrors(['quotation_id']);

    expect($deliveryOrder->refresh()->quotation_id)->toBe($quotation->id);
});

test('confirmed delivery order cannot be updated', function () {
    $user = User::factory()->create();
    $quotation = quotationWithItem();
    $item = $quotation->items->first();
    $deliveryOrder = DeliveryOrder::factory()->create([
        'quotation_id' => $quotation->id,
        'status' => 'confirmed',
    ]);

    $this->actingAs($user)->put(route('delivery-orders.update', $deliveryOrder), [
        'quotation_id' => $quotation->id,
        'delivery_date' => now()->toDateString(),
        'items' => [
            ['quotation_item_id' => $item->id, 'quantity_delivered' => 1],
        ],
    ])->assertForbidden();
});

test('guests cannot update delivery orders', function () {
    $deliveryOrder = DeliveryOrder::factory()->create();

    $this->put(route('delivery-orders.update', $deliveryOrder), [])
        ->assertRedirect(route('login'));
});
