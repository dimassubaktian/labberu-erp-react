<?php

use App\Models\PurchaseOrder;
use App\Models\User;

test('purchase orders can be searched by code', function () {
    $user = User::factory()->create();
    $approved = PurchaseOrder::factory()->create(['status' => 'approved']);
    PurchaseOrder::factory()->create(['status' => 'approved']);

    $this->actingAs($user)
        ->getJson(route('purchase-orders.search', ['q' => $approved->purchase_order_code]))
        ->assertOk()
        ->assertJsonCount(1, 'data')
        ->assertJsonFragment(['id' => $approved->id]);
});

test('only approved purchase orders are returned by search', function () {
    $user = User::factory()->create();
    PurchaseOrder::factory()->create(['status' => 'draft']);
    PurchaseOrder::factory()->create(['status' => 'issued']);
    $approved = PurchaseOrder::factory()->create(['status' => 'approved']);

    $this->actingAs($user)
        ->getJson(route('purchase-orders.search'))
        ->assertOk()
        ->assertJsonCount(1, 'data')
        ->assertJsonFragment(['id' => $approved->id]);
});

test('guests cannot search purchase orders', function () {
    $this->getJson(route('purchase-orders.search'))
        ->assertUnauthorized();
});
