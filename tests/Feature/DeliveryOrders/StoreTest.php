<?php

use App\Models\DeliveryOrder;
use App\Models\Product;
use App\Models\Quotation;
use App\Models\User;

function approvedQuotationWithItem(array $overrides = []): Quotation
{
    $quotation = Quotation::factory()->create(array_merge(['status' => 'approved'], $overrides));

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

test('delivery order can be created against an approved quotation', function () {
    $user = User::factory()->create();
    $quotation = approvedQuotationWithItem();
    $item = $quotation->items->first();

    $response = $this->actingAs($user)->post(route('delivery-orders.store'), [
        'quotation_id' => $quotation->id,
        'delivery_date' => now()->toDateString(),
        'items' => [
            ['quotation_item_id' => $item->id, 'quantity_delivered' => 6],
        ],
    ]);

    $response->assertSessionHasNoErrors();

    $deliveryOrder = DeliveryOrder::sole();
    $response->assertRedirect(route('delivery-orders.show', $deliveryOrder));
    expect($deliveryOrder->status)->toBe('draft');
    expect($deliveryOrder->do_code)->toStartWith('LAB-DO');

    $doItem = $deliveryOrder->items()->sole();
    expect($doItem->product_id)->toBe($item->product_id);
    expect($doItem->quotation_item_id)->toBe($item->id);
    expect((float) $doItem->quantity_ordered)->toBe(10.0);
    expect($doItem->unit)->toBe('Pcs');
    expect((float) $doItem->quantity_delivered)->toBe(6.0);
});

test('delivery order cannot be created against a non-approved quotation', function () {
    $user = User::factory()->create();
    $quotation = approvedQuotationWithItem(['status' => 'draft']);
    $item = $quotation->items->first();

    $this->actingAs($user)->post(route('delivery-orders.store'), [
        'quotation_id' => $quotation->id,
        'delivery_date' => now()->toDateString(),
        'items' => [
            ['quotation_item_id' => $item->id, 'quantity_delivered' => 1],
        ],
    ])->assertForbidden();
});

test('items must belong to the selected quotation', function () {
    $user = User::factory()->create();
    $quotation = approvedQuotationWithItem();
    $otherQuotation = approvedQuotationWithItem();
    $otherItem = $otherQuotation->items->first();

    $this->actingAs($user)->post(route('delivery-orders.store'), [
        'quotation_id' => $quotation->id,
        'delivery_date' => now()->toDateString(),
        'items' => [
            ['quotation_item_id' => $otherItem->id, 'quantity_delivered' => 1],
        ],
    ])->assertSessionHasErrors(['items.0.quotation_item_id']);
});

test('at least one item is required', function () {
    $user = User::factory()->create();
    $quotation = approvedQuotationWithItem();

    $this->actingAs($user)->post(route('delivery-orders.store'), [
        'quotation_id' => $quotation->id,
        'delivery_date' => now()->toDateString(),
        'items' => [],
    ])->assertSessionHasErrors(['items']);
});

test('guests cannot create delivery orders', function () {
    $this->post(route('delivery-orders.store'), [])
        ->assertRedirect(route('login'));
});
