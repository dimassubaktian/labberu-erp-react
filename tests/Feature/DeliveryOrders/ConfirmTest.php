<?php

use App\Models\DeliveryOrder;
use App\Models\Product;
use App\Models\Quotation;
use App\Models\QuotationItem;
use App\Models\StockMovement;
use App\Models\User;
use App\Models\Workforce;

/**
 * @param  array<int, float>  $quantities
 */
function quotationWithItemQuantities(array $quantities): Quotation
{
    $quotation = Quotation::factory()->create(['status' => 'approved']);

    foreach ($quantities as $quantity) {
        $quotation->items()->create([
            'product_id' => Product::factory()->create()->id,
            'quantity' => $quantity,
            'unit' => 'Pcs',
            'unit_price' => 1_000,
            'unit_cost' => 500,
            'total_price' => $quantity * 1_000,
            'total_cost' => $quantity * 500,
            'margin' => $quantity * 500,
            'margin_percent' => 50,
        ]);
    }

    return $quotation->fresh('items');
}

function draftDeliveryOrderFor(QuotationItem $item, float $delivered): DeliveryOrder
{
    $deliveryOrder = DeliveryOrder::factory()->create([
        'quotation_id' => $item->quotation_id,
        'status' => 'draft',
    ]);

    $deliveryOrder->items()->create([
        'product_id' => $item->product_id,
        'quotation_item_id' => $item->id,
        'quantity_ordered' => $item->quantity,
        'unit' => $item->unit,
        'quantity_delivered' => $delivered,
    ]);

    return $deliveryOrder;
}

test('confirming a delivery order sets partially_delivered when not everything has shipped', function () {
    $user = User::factory()->create();
    $workforce = Workforce::factory()->create();
    $quotation = quotationWithItemQuantities([10]);
    $item = $quotation->items->first();
    $deliveryOrder = draftDeliveryOrderFor($item, 4);

    $response = $this->actingAs($user)->patch(route('delivery-orders.confirm', $deliveryOrder), [
        'delivered_by_id' => $workforce->id,
    ]);

    $response->assertSessionHasNoErrors();
    expect($deliveryOrder->refresh()->status)->toBe('confirmed');
    expect($deliveryOrder->delivered_by_id)->toBe($workforce->id);
    expect($deliveryOrder->delivered_at)->not->toBeNull();
    expect($quotation->refresh()->progress)->toBe('partially_delivered');
});

test('confirming enough delivery orders to cover every line sets fully_delivered', function () {
    $user = User::factory()->create();
    $quotation = quotationWithItemQuantities([10, 5]);
    [$itemA, $itemB] = $quotation->items;

    $this->actingAs($user)->patch(route('delivery-orders.confirm', draftDeliveryOrderFor($itemA, 10)), [
        'delivered_by_id' => Workforce::factory()->create()->id,
    ])->assertSessionHasNoErrors();

    expect($quotation->refresh()->progress)->toBe('partially_delivered');

    $this->actingAs($user)->patch(route('delivery-orders.confirm', draftDeliveryOrderFor($itemB, 5)), [
        'delivered_by_id' => Workforce::factory()->create()->id,
    ])->assertSessionHasNoErrors();

    expect($quotation->refresh()->progress)->toBe('fully_delivered');
});

test('progress derivation compares per line item, not an aggregate total', function () {
    $user = User::factory()->create();
    $quotation = quotationWithItemQuantities([5, 5]);
    [$itemA, $itemB] = $quotation->items;

    // Item A is over-delivered to 10 (double its order); item B never ships.
    // An aggregate sum (10 delivered / 10 ordered) would wrongly read as fully delivered.
    $deliveryOrder = draftDeliveryOrderFor($itemA, 10);

    $this->actingAs($user)->patch(route('delivery-orders.confirm', $deliveryOrder), [
        'delivered_by_id' => Workforce::factory()->create()->id,
    ])->assertSessionHasNoErrors();

    expect($quotation->refresh()->progress)->toBe('partially_delivered');
});

test('a draft delivery order does not affect the quotation progress until confirmed', function () {
    $quotation = quotationWithItemQuantities([10]);
    $item = $quotation->items->first();
    draftDeliveryOrderFor($item, 10);

    expect($quotation->refresh()->progress)->toBeNull();
});

test('delivery order cannot be confirmed once the quotation is no longer approved', function () {
    $user = User::factory()->create();
    $quotation = quotationWithItemQuantities([10]);
    $item = $quotation->items->first();
    $deliveryOrder = draftDeliveryOrderFor($item, 4);

    $quotation->update(['status' => 'voided']);

    $this->actingAs($user)
        ->patch(route('delivery-orders.confirm', $deliveryOrder), [
            'delivered_by_id' => Workforce::factory()->create()->id,
        ])
        ->assertForbidden();

    expect($deliveryOrder->refresh()->status)->toBe('draft');
});

test('a confirmed delivery order cannot be confirmed again', function () {
    $user = User::factory()->create();
    $quotation = quotationWithItemQuantities([10]);
    $item = $quotation->items->first();
    $deliveryOrder = draftDeliveryOrderFor($item, 4);
    $deliveryOrder->update(['status' => 'confirmed']);

    $this->actingAs($user)
        ->patch(route('delivery-orders.confirm', $deliveryOrder), [
            'delivered_by_id' => Workforce::factory()->create()->id,
        ])
        ->assertForbidden();
});

test('guests cannot confirm delivery orders', function () {
    $quotation = quotationWithItemQuantities([10]);
    $item = $quotation->items->first();
    $deliveryOrder = draftDeliveryOrderFor($item, 4);

    $this->patch(route('delivery-orders.confirm', $deliveryOrder), [])
        ->assertRedirect(route('login'));
});

test('confirming a delivery order creates an out stock movement for each delivered, physical-goods line', function () {
    $user = User::factory()->create();
    $goodsProduct = Product::factory()->create(['type' => 'goods']);
    $serviceProduct = Product::factory()->create(['type' => 'service']);
    $quotation = Quotation::factory()->create(['status' => 'approved']);

    $goodsItem = $quotation->items()->create([
        'product_id' => $goodsProduct->id,
        'quantity' => 10,
        'unit' => 'Pcs',
        'unit_price' => 1_000,
        'unit_cost' => 500,
        'total_price' => 10_000,
        'total_cost' => 5_000,
        'margin' => 5_000,
        'margin_percent' => 50,
    ]);
    $serviceItem = $quotation->items()->create([
        'product_id' => $serviceProduct->id,
        'quantity' => 5,
        'unit' => 'Hours',
        'unit_price' => 1_000,
        'unit_cost' => 500,
        'total_price' => 5_000,
        'total_cost' => 2_500,
        'margin' => 2_500,
        'margin_percent' => 50,
    ]);

    $deliveryOrder = DeliveryOrder::factory()->create([
        'quotation_id' => $quotation->id,
        'status' => 'draft',
        'delivery_date' => '2026-02-01',
    ]);
    $deliveryOrder->items()->create([
        'product_id' => $goodsItem->product_id,
        'quotation_item_id' => $goodsItem->id,
        'quantity_ordered' => $goodsItem->quantity,
        'unit' => $goodsItem->unit,
        'quantity_delivered' => 4,
    ]);
    $deliveryOrder->items()->create([
        'product_id' => $serviceItem->product_id,
        'quotation_item_id' => $serviceItem->id,
        'quantity_ordered' => $serviceItem->quantity,
        'unit' => $serviceItem->unit,
        'quantity_delivered' => 5,
    ]);

    $this->actingAs($user)->patch(route('delivery-orders.confirm', $deliveryOrder), [
        'delivered_by_id' => Workforce::factory()->create()->id,
    ])->assertSessionHasNoErrors();

    $movement = StockMovement::sole();
    expect($movement->product_id)->toBe($goodsProduct->id);
    expect($movement->type)->toBe('out');
    expect((float) $movement->quantity)->toBe(4.0);
    expect($movement->movement_date->toDateString())->toBe('2026-02-01');
});

test('a delivery order line with zero delivered quantity creates no stock movement', function () {
    $user = User::factory()->create();
    $goodsProduct = Product::factory()->create(['type' => 'goods']);
    $quotation = quotationWithItemQuantities([10]);
    $item = $quotation->items->first();
    $item->update(['product_id' => $goodsProduct->id]);

    $deliveryOrder = DeliveryOrder::factory()->create([
        'quotation_id' => $quotation->id,
        'status' => 'draft',
    ]);
    $deliveryOrder->items()->create([
        'product_id' => $item->product_id,
        'quotation_item_id' => $item->id,
        'quantity_ordered' => $item->quantity,
        'unit' => $item->unit,
        'quantity_delivered' => 0,
    ]);

    $this->actingAs($user)->patch(route('delivery-orders.confirm', $deliveryOrder), [
        'delivered_by_id' => Workforce::factory()->create()->id,
    ])->assertSessionHasNoErrors();

    expect(StockMovement::count())->toBe(0);
});
