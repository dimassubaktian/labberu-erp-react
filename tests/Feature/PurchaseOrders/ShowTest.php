<?php

use App\Models\PurchaseInvoice;
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

test('purchase order show page lists its related purchase invoices', function () {
    $user = User::factory()->create();
    $purchaseOrder = PurchaseOrder::factory()->create();
    $purchaseInvoice = PurchaseInvoice::factory()->create(['purchase_order_id' => $purchaseOrder->id]);

    $this->actingAs($user)
        ->get(route('purchase-orders.show', $purchaseOrder))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('purchase-orders/show')
            ->where('purchaseOrder.purchase_invoices.0.id', $purchaseInvoice->id),
        );
});

test('guests cannot view a purchase order', function () {
    $purchaseOrder = PurchaseOrder::factory()->create();

    $this->get(route('purchase-orders.show', $purchaseOrder))
        ->assertRedirect(route('login'));
});
