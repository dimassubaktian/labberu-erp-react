<?php

use App\Models\Product;
use App\Models\User;
use Inertia\Testing\AssertableInertia as Assert;

test('products index page is displayed', function () {
    $user = User::factory()->create();
    Product::factory()->create(['name' => 'Ballpoint Pen']);
    Product::factory()->create(['name' => 'Notebook']);

    $this->actingAs($user)
        ->get(route('products.index'))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('products/index')
            ->has('products.data', 2),
        );
});

test('trashed products are not listed', function () {
    $user = User::factory()->create();
    Product::factory()->create();
    Product::factory()->create()->delete();

    $this->actingAs($user)
        ->get(route('products.index'))
        ->assertInertia(fn (Assert $page) => $page
            ->has('products.data', 1),
        );
});

test('guests cannot view products', function () {
    $this->get(route('products.index'))
        ->assertRedirect(route('login'));
});
