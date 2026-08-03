<?php

use App\Models\Product;
use App\Models\StockMovement;
use App\Models\User;
use Inertia\Testing\AssertableInertia as Assert;

test('product show page includes computed stock on hand from its movements', function () {
    $user = User::factory()->create();
    $product = Product::factory()->create(['type' => 'goods']);

    StockMovement::create([
        'product_id' => $product->id,
        'type' => 'in',
        'quantity' => 10,
        'movement_date' => now()->toDateString(),
    ]);
    StockMovement::create([
        'product_id' => $product->id,
        'type' => 'out',
        'quantity' => 3,
        'movement_date' => now()->toDateString(),
    ]);

    $this->actingAs($user)
        ->get(route('products.show', $product))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('products/show')
            ->where('stockOnHand', 7),
        );
});

test('a product with no movements has zero stock on hand', function () {
    $user = User::factory()->create();
    $product = Product::factory()->create(['type' => 'goods']);

    $this->actingAs($user)
        ->get(route('products.show', $product))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('products/show')
            ->where('stockOnHand', 0),
        );
});
