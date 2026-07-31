<?php

use App\Models\Product;
use App\Models\User;
use Inertia\Testing\AssertableInertia as Assert;

test('product edit page is displayed', function () {
    $user = User::factory()->create();
    $product = Product::factory()->create(['name' => 'MCB 1 Phase 10A']);

    $this->actingAs($user)
        ->get(route('products.edit', $product))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('products/edit')
            ->where('product.uuid', $product->uuid)
            ->where('product.name', 'MCB 1 Phase 10A'),
        );
});

test('product can be updated', function () {
    $user = User::factory()->create();
    $product = Product::factory()->create([
        'name' => 'MCB 1 Phase 10A',
        'brand' => 'Schneider Electric',
        'type' => 'goods',
        'status' => 'active',
    ]);

    $response = $this->actingAs($user)
        ->put(route('products.update', $product), [
            'name' => 'MCB 1 Phase 16A',
            'reference_number' => 'REF-00099999',
            'descriptions' => 'Updated description',
            'brand' => 'ABB',
            'unit' => 'Box',
            'type' => 'goods',
            'status' => 'inactive',
        ]);

    $response
        ->assertSessionHasNoErrors()
        ->assertRedirect(route('products.show', $product));

    $this->assertDatabaseHas('products', [
        'id' => $product->id,
        'name' => 'MCB 1 Phase 16A',
        'reference_number' => 'REF-00099999',
        'brand' => 'ABB',
        'unit' => 'Box',
        'status' => 'inactive',
    ]);
});

test('product code is not changed by an update', function () {
    $user = User::factory()->create();
    $product = Product::factory()->create();
    $originalCode = $product->product_code;

    $this->actingAs($user)->put(route('products.update', $product), [
        'name' => 'Updated Name',
        'reference_number' => $product->reference_number,
        'descriptions' => $product->descriptions,
        'brand' => $product->brand,
        'unit' => $product->unit,
        'type' => $product->type,
        'status' => $product->status,
    ]);

    $this->assertDatabaseHas('products', [
        'id' => $product->id,
        'product_code' => $originalCode,
    ]);
});

test('required fields are validated', function () {
    $user = User::factory()->create();
    $product = Product::factory()->create();

    $this->actingAs($user)
        ->put(route('products.update', $product), [])
        ->assertSessionHasErrors([
            'name',
            'reference_number',
            'descriptions',
            'brand',
            'unit',
            'type',
            'status',
        ]);
});

test('type must be goods or service', function () {
    $user = User::factory()->create();
    $product = Product::factory()->create();

    $this->actingAs($user)
        ->put(route('products.update', $product), [
            'name' => $product->name,
            'reference_number' => $product->reference_number,
            'descriptions' => $product->descriptions,
            'brand' => $product->brand,
            'unit' => $product->unit,
            'type' => 'consumable',
            'status' => $product->status,
        ])
        ->assertSessionHasErrors('type');
});

test('guests cannot edit or update products', function () {
    $product = Product::factory()->create();

    $this->get(route('products.edit', $product))
        ->assertRedirect(route('login'));

    $this->put(route('products.update', $product), [])
        ->assertRedirect(route('login'));
});
