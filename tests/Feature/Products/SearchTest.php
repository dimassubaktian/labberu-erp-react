<?php

use App\Models\Product;
use App\Models\User;

test('products can be searched by name', function () {
    $user = User::factory()->create();
    Product::factory()->create(['name' => 'Ballpoint Pen']);
    Product::factory()->create(['name' => 'Notebook']);

    $this->actingAs($user)
        ->getJson(route('products.search', ['q' => 'Ballpoint']))
        ->assertOk()
        ->assertJsonCount(1, 'data')
        ->assertJsonFragment(['name' => 'Ballpoint Pen']);
});

test('products can be searched by product code', function () {
    $user = User::factory()->create();
    $product = Product::factory()->create(['name' => 'Ballpoint Pen']);
    Product::factory()->create(['name' => 'Notebook']);

    $this->actingAs($user)
        ->getJson(route('products.search', ['q' => $product->product_code]))
        ->assertOk()
        ->assertJsonCount(1, 'data')
        ->assertJsonFragment(['id' => $product->id]);
});

test('inactive products are not returned by search', function () {
    $user = User::factory()->create();
    Product::factory()->inactive()->create(['name' => 'Retired Widget']);

    $this->actingAs($user)
        ->getJson(route('products.search', ['q' => 'Retired']))
        ->assertJsonCount(0, 'data');
});

test('trashed products are not returned by search', function () {
    $user = User::factory()->create();
    Product::factory()->create(['name' => 'Deleted Widget'])->delete();

    $this->actingAs($user)
        ->getJson(route('products.search', ['q' => 'Deleted']))
        ->assertJsonCount(0, 'data');
});

test('guests cannot search products', function () {
    $this->getJson(route('products.search'))
        ->assertUnauthorized();
});
