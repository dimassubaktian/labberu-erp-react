<?php

use App\Models\Product;
use App\Models\User;
use Inertia\Testing\AssertableInertia as Assert;

test('product detail page is displayed', function () {
    $user = User::factory()->create();
    $product = Product::factory()->create(['name' => 'MCB 1 Phase 10A']);

    $this->actingAs($user)
        ->get(route('products.show', $product))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('products/show')
            ->where('product.uuid', $product->uuid)
            ->where('product.name', 'MCB 1 Phase 10A'),
        );
});

test('product detail page is resolved by uuid, not the numeric id', function () {
    $user = User::factory()->create();
    $product = Product::factory()->create();

    $this->actingAs($user)
        ->get(route('products.show', $product))
        ->assertOk();

    expect(route('products.show', $product))->toContain($product->uuid);
});

test('trashed products are not found', function () {
    $user = User::factory()->create();
    $product = Product::factory()->create();
    $product->delete();

    $this->actingAs($user)
        ->get(route('products.show', $product))
        ->assertNotFound();
});

test('guests cannot view a product', function () {
    $product = Product::factory()->create();

    $this->get(route('products.show', $product))
        ->assertRedirect(route('login'));
});
