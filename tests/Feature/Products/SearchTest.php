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

test('products can be searched by reference number', function () {
    $user = User::factory()->create();
    $product = Product::factory()->create(['name' => 'Ballpoint Pen', 'reference_number' => 'REF-00012345']);
    Product::factory()->create(['name' => 'Notebook', 'reference_number' => 'REF-00099999']);

    $this->actingAs($user)
        ->getJson(route('products.search', ['q' => 'REF-00012345']))
        ->assertOk()
        ->assertJsonCount(1, 'data')
        ->assertJsonFragment(['id' => $product->id]);
});

test('product search results include the reference number', function () {
    $user = User::factory()->create();
    $product = Product::factory()->create(['name' => 'Ballpoint Pen', 'reference_number' => 'REF-00012345']);

    $response = $this->actingAs($user)
        ->getJson(route('products.search', ['q' => 'Ballpoint']))
        ->assertOk();

    expect($response->json('data.0.reference_number'))->toBe($product->reference_number);
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

test('products can be filtered by type', function () {
    $user = User::factory()->create();
    Product::factory()->create(['name' => 'Ballpoint Pen', 'type' => 'goods']);
    Product::factory()->create(['name' => 'Consulting Hour', 'type' => 'service']);

    $this->actingAs($user)
        ->getJson(route('products.search', ['type' => 'goods']))
        ->assertOk()
        ->assertJsonCount(1, 'data')
        ->assertJsonFragment(['name' => 'Ballpoint Pen']);
});

test('omitting the type filter returns products of every type', function () {
    $user = User::factory()->create();
    Product::factory()->create(['name' => 'Ballpoint Pen', 'type' => 'goods']);
    Product::factory()->create(['name' => 'Consulting Hour', 'type' => 'service']);

    $this->actingAs($user)
        ->getJson(route('products.search'))
        ->assertOk()
        ->assertJsonCount(2, 'data');
});

test('guests cannot search products', function () {
    $this->getJson(route('products.search'))
        ->assertUnauthorized();
});
