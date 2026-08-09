<?php

use App\Models\DeliveryOrder;
use App\Models\Product;
use App\Models\Quotation;
use App\Models\User;

function deliveryOrderWithItem(array $overrides = []): DeliveryOrder
{
    $deliveryOrder = DeliveryOrder::factory()->create(array_merge([
        'quotation_id' => Quotation::factory()->create(['po_number' => 'PO-123', 'po_date' => now()])->id,
    ], $overrides));

    $deliveryOrder->items()->create([
        'product_id' => Product::factory()->create()->id,
        'quantity_ordered' => 10,
        'unit' => 'Pcs',
        'quantity_delivered' => 5,
    ]);

    return $deliveryOrder->fresh('items');
}

test('delivery order print streams pdf inline by default', function () {
    $user = User::factory()->create();
    $deliveryOrder = deliveryOrderWithItem();

    $response = $this->actingAs($user)
        ->get(route('delivery-orders.print', $deliveryOrder));

    $response->assertOk();
    $response->assertHeader('Content-Type', 'application/pdf');
    expect($response->headers->get('Content-Disposition'))->toContain('inline');
});

test('delivery order print forces download when download param is true', function () {
    $user = User::factory()->create();
    $deliveryOrder = deliveryOrderWithItem();

    $response = $this->actingAs($user)
        ->get(route('delivery-orders.print', [$deliveryOrder, 'download' => 'true']));

    $response->assertOk();
    $response->assertHeader('Content-Type', 'application/pdf');
    expect($response->headers->get('Content-Disposition'))->toContain('attachment');
    expect($response->headers->get('Content-Disposition'))->toContain("delivery-order-{$deliveryOrder->do_code}.pdf");
});

test('delivery order print renders ok without a customer po number', function () {
    $user = User::factory()->create();
    $deliveryOrder = deliveryOrderWithItem([
        'quotation_id' => Quotation::factory()->create(['po_number' => null, 'po_date' => null])->id,
    ]);

    $response = $this->actingAs($user)
        ->get(route('delivery-orders.print', $deliveryOrder));

    $response->assertOk();
    $response->assertHeader('Content-Type', 'application/pdf');
});

test('guests cannot print a delivery order', function () {
    $deliveryOrder = deliveryOrderWithItem();

    $this->get(route('delivery-orders.print', $deliveryOrder))
        ->assertRedirect(route('login'));
});
