<?php

use App\Models\DeliveryOrder;
use App\Models\Product;
use App\Models\Quotation;
use App\Models\StockMovement;
use App\Models\User;

/**
 * Build a confirmed DO with stock movements already created, mirroring what
 * DeliveryOrderController::confirm() does, without going through the HTTP layer.
 *
 * @param  array<int, float>  $deliveredQuantities
 * @return array{do: DeliveryOrder, quotation: Quotation}
 */
function confirmedDo(array $deliveredQuantities): array
{
    $quotation = Quotation::factory()->create(['status' => 'approved', 'progress' => 'signed']);

    $items = [];
    foreach ($deliveredQuantities as $qty) {
        $items[] = $quotation->items()->create([
            'product_id' => Product::factory()->create(['type' => 'goods'])->id,
            'quantity' => $qty,
            'unit' => 'Pcs',
            'unit_price' => 1_000,
            'unit_cost' => 500,
            'total_price' => $qty * 1_000,
            'total_cost' => $qty * 500,
            'margin' => $qty * 500,
            'margin_percent' => 50,
        ]);
    }

    $deliveryOrder = DeliveryOrder::factory()->create([
        'quotation_id' => $quotation->id,
        'status' => 'confirmed',
        'delivery_date' => '2026-01-15',
    ]);

    foreach ($items as $quotationItem) {
        $doItem = $deliveryOrder->items()->create([
            'product_id' => $quotationItem->product_id,
            'quotation_item_id' => $quotationItem->id,
            'quantity_ordered' => $quotationItem->quantity,
            'unit' => $quotationItem->unit,
            'quantity_delivered' => $quotationItem->quantity,
        ]);

        StockMovement::create([
            'product_id' => $quotationItem->product_id,
            'type' => 'out',
            'quantity' => $quotationItem->quantity,
            'movement_date' => '2026-01-15',
            'delivery_order_item_id' => $doItem->id,
        ]);
    }

    return ['do' => $deliveryOrder, 'quotation' => $quotation->fresh('items')];
}

test('cancelling a confirmed delivery order deletes its stock movements', function () {
    $user = User::factory()->create();
    ['do' => $deliveryOrder] = confirmedDo([10]);

    expect(StockMovement::count())->toBe(1);

    $this->actingAs($user)
        ->patch(route('delivery-orders.cancel', $deliveryOrder))
        ->assertSessionHasNoErrors();

    expect($deliveryOrder->refresh()->status)->toBe('cancelled');
    expect(StockMovement::count())->toBe(0);
});

test('cancelling the only confirmed delivery order resets quotation progress to signed', function () {
    $user = User::factory()->create();
    ['do' => $deliveryOrder, 'quotation' => $quotation] = confirmedDo([10]);
    $quotation->update(['progress' => 'fully_delivered']);

    $this->actingAs($user)
        ->patch(route('delivery-orders.cancel', $deliveryOrder))
        ->assertSessionHasNoErrors();

    expect($quotation->refresh()->progress)->toBe('signed');
});

test('cancelling one of two confirmed delivery orders recomputes quotation progress without full reset', function () {
    $user = User::factory()->create();
    $quotation = Quotation::factory()->create(['status' => 'approved', 'progress' => 'signed']);

    $quotationItemA = $quotation->items()->create([
        'product_id' => Product::factory()->create(['type' => 'goods'])->id,
        'quantity' => 10,
        'unit' => 'Pcs',
        'unit_price' => 1_000,
        'unit_cost' => 500,
        'total_price' => 10_000,
        'total_cost' => 5_000,
        'margin' => 5_000,
        'margin_percent' => 50,
    ]);
    $quotationItemB = $quotation->items()->create([
        'product_id' => Product::factory()->create(['type' => 'goods'])->id,
        'quantity' => 5,
        'unit' => 'Pcs',
        'unit_price' => 1_000,
        'unit_cost' => 500,
        'total_price' => 5_000,
        'total_cost' => 2_500,
        'margin' => 2_500,
        'margin_percent' => 50,
    ]);

    $doA = DeliveryOrder::factory()->create([
        'quotation_id' => $quotation->id,
        'status' => 'confirmed',
        'delivery_date' => '2026-01-15',
    ]);
    $doItemA = $doA->items()->create([
        'product_id' => $quotationItemA->product_id,
        'quotation_item_id' => $quotationItemA->id,
        'quantity_ordered' => 10,
        'unit' => 'Pcs',
        'quantity_delivered' => 10,
    ]);
    StockMovement::create([
        'product_id' => $quotationItemA->product_id,
        'type' => 'out',
        'quantity' => 10,
        'movement_date' => '2026-01-15',
        'delivery_order_item_id' => $doItemA->id,
    ]);

    $doB = DeliveryOrder::factory()->create([
        'quotation_id' => $quotation->id,
        'status' => 'confirmed',
        'delivery_date' => '2026-01-16',
    ]);
    $doItemB = $doB->items()->create([
        'product_id' => $quotationItemB->product_id,
        'quotation_item_id' => $quotationItemB->id,
        'quantity_ordered' => 5,
        'unit' => 'Pcs',
        'quantity_delivered' => 5,
    ]);
    StockMovement::create([
        'product_id' => $quotationItemB->product_id,
        'type' => 'out',
        'quantity' => 5,
        'movement_date' => '2026-01-16',
        'delivery_order_item_id' => $doItemB->id,
    ]);

    $quotation->update(['progress' => 'fully_delivered']);

    // Cancel DO B — item B no longer delivered → drops to partially_delivered
    $this->actingAs($user)
        ->patch(route('delivery-orders.cancel', $doB))
        ->assertSessionHasNoErrors();

    expect($quotation->refresh()->progress)->toBe('partially_delivered');
    expect(StockMovement::count())->toBe(1);
});

test('a draft delivery order cannot be cancelled', function () {
    $user = User::factory()->create();
    $deliveryOrder = DeliveryOrder::factory()->create(['status' => 'draft']);

    $this->actingAs($user)
        ->patch(route('delivery-orders.cancel', $deliveryOrder))
        ->assertForbidden();
});

test('guests cannot cancel a delivery order', function () {
    $deliveryOrder = DeliveryOrder::factory()->create(['status' => 'confirmed']);

    $this->patch(route('delivery-orders.cancel', $deliveryOrder))
        ->assertRedirect(route('login'));
});
