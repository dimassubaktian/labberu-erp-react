<?php

use App\Models\Product;
use App\Models\User;

test('product can be deleted', function () {
    $user = User::factory()->create();
    $product = Product::factory()->create();

    $response = $this->actingAs($user)
        ->delete(route('products.destroy', $product));

    $response->assertRedirect(route('products.index'));

    $this->assertSoftDeleted($product);
});

test('guests cannot delete products', function () {
    $product = Product::factory()->create();

    $this->delete(route('products.destroy', $product))
        ->assertRedirect(route('login'));

    $this->assertNotSoftDeleted($product);
});
