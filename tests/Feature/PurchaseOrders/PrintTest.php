<?php

use App\Models\Product;
use App\Models\PurchaseOrder;
use App\Models\User;

function printablePurchaseOrder(array $overrides = []): PurchaseOrder
{
    $purchaseOrder = PurchaseOrder::factory()->create(array_merge([
        'address' => '123 Vendor Street',
        'attention' => 'Vendor Contact',
        'phone' => '021-555-0100',
        'quotation_no' => 'Q-2026-0001',
        'quotation_date' => now(),
        'shipping_method' => 'Courier',
        'shipping_terms' => 'FOB',
        'delivery_date' => now()->addWeek(),
    ], $overrides));

    $purchaseOrder->items()->create([
        'product_id' => Product::factory()->create()->id,
        'reference_number' => 'REF-001',
        'quantity' => 10,
        'unit' => 'Pcs',
        'unit_price' => 1_000,
        'total' => 10_000,
    ]);

    $purchaseOrder->discounts()->create([
        'sequence' => 1,
        'label' => 'Trade discount',
        'discount_type' => 'percentage',
        'discount_value' => 10,
        'base_amount' => 10_000,
        'discount_amount' => 1_000,
    ]);

    return $purchaseOrder->fresh(['items', 'discounts']);
}

test('purchase order print streams pdf inline by default', function () {
    $user = User::factory()->create();
    $purchaseOrder = printablePurchaseOrder();

    $response = $this->actingAs($user)
        ->get(route('purchase-orders.print', $purchaseOrder));

    $response->assertOk();
    $response->assertHeader('Content-Type', 'application/pdf');
    expect($response->headers->get('Content-Disposition'))->toContain('inline');
});

test('purchase order print forces download when download param is true', function () {
    $user = User::factory()->create();
    $purchaseOrder = printablePurchaseOrder();

    $response = $this->actingAs($user)
        ->get(route('purchase-orders.print', [$purchaseOrder, 'download' => 'true']));

    $response->assertOk();
    $response->assertHeader('Content-Type', 'application/pdf');
    expect($response->headers->get('Content-Disposition'))->toContain('attachment');
    expect($response->headers->get('Content-Disposition'))->toContain("purchase-order-{$purchaseOrder->purchase_order_code}.pdf");
});

test('purchase order print renders ok without shipping details or discounts', function () {
    $user = User::factory()->create();
    $purchaseOrder = PurchaseOrder::factory()->create();
    $purchaseOrder->items()->create([
        'product_id' => Product::factory()->create()->id,
        'quantity' => 1,
        'unit' => 'Pcs',
        'unit_price' => 500,
        'total' => 500,
    ]);

    $response = $this->actingAs($user)
        ->get(route('purchase-orders.print', $purchaseOrder));

    $response->assertOk();
    $response->assertHeader('Content-Type', 'application/pdf');
});

test('guests cannot print a purchase order', function () {
    $purchaseOrder = printablePurchaseOrder();

    $this->get(route('purchase-orders.print', $purchaseOrder))
        ->assertRedirect(route('login'));
});
