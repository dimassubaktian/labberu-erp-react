<?php

use App\Models\User;
use Inertia\Testing\AssertableInertia as Assert;

test('product create page is displayed', function () {
    $user = User::factory()->create();

    $this->actingAs($user)
        ->get(route('products.create'))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('products/create'),
        );
});

test('product can be created', function () {
    $user = User::factory()->create();

    $response = $this->actingAs($user)
        ->post(route('products.store'), [
            'name' => 'MCB 1 Phase 10A',
            'reference_number' => 'REF-00012345',
            'descriptions' => 'Miniature circuit breaker, 1 phase, 10 ampere.',
            'brand' => 'Schneider Electric',
            'unit' => 'Pcs',
            'type' => 'goods',
            'status' => 'active',
        ]);

    $response
        ->assertSessionHasNoErrors()
        ->assertRedirect(route('products.index'));

    $this->assertDatabaseHas('products', [
        'name' => 'MCB 1 Phase 10A',
        'brand' => 'Schneider Electric',
        'unit' => 'Pcs',
        'type' => 'goods',
        'status' => 'active',
    ]);
});

test('price and cost are optional and default to zero', function () {
    $user = User::factory()->create();

    $this->actingAs($user)->post(route('products.store'), [
        'name' => 'MCB 1 Phase 10A',
        'reference_number' => 'REF-00012345',
        'descriptions' => 'Description',
        'brand' => 'Schneider Electric',
        'unit' => 'Pcs',
        'type' => 'goods',
        'status' => 'active',
    ]);

    $this->assertDatabaseHas('products', [
        'name' => 'MCB 1 Phase 10A',
        'price' => 0,
        'cost' => 0,
    ]);
});

test('blank price and cost inputs default to zero', function () {
    $user = User::factory()->create();

    $response = $this->actingAs($user)->post(route('products.store'), [
        'name' => 'MCB 1 Phase 10A',
        'reference_number' => 'REF-00012345',
        'descriptions' => 'Description',
        'brand' => 'Schneider Electric',
        'unit' => 'Pcs',
        'type' => 'goods',
        'price' => '',
        'cost' => '',
        'status' => 'active',
    ]);

    $response->assertSessionHasNoErrors();

    $this->assertDatabaseHas('products', [
        'name' => 'MCB 1 Phase 10A',
        'price' => 0,
        'cost' => 0,
    ]);
});

test('price and cost can be set', function () {
    $user = User::factory()->create();

    $this->actingAs($user)->post(route('products.store'), [
        'name' => 'MCB 1 Phase 10A',
        'reference_number' => 'REF-00012345',
        'descriptions' => 'Description',
        'brand' => 'Schneider Electric',
        'unit' => 'Pcs',
        'type' => 'goods',
        'price' => '150000.50',
        'cost' => '90000.25',
        'status' => 'active',
    ]);

    $this->assertDatabaseHas('products', [
        'name' => 'MCB 1 Phase 10A',
        'price' => 150000.50,
        'cost' => 90000.25,
    ]);
});

test('product code is generated automatically', function () {
    $user = User::factory()->create();

    $this->actingAs($user)->post(route('products.store'), [
        'name' => 'MCB 1 Phase 10A',
        'reference_number' => 'REF-00012345',
        'descriptions' => 'Description',
        'brand' => 'Schneider Electric',
        'unit' => 'Pcs',
        'type' => 'goods',
        'status' => 'active',
    ]);

    $this->assertDatabaseHas('products', ['product_code' => 'LAB-PRODUCT-001']);

    $this->actingAs($user)->post(route('products.store'), [
        'name' => 'MCB 3 Phase 20A',
        'reference_number' => 'REF-00012346',
        'descriptions' => 'Description',
        'brand' => 'Schneider Electric',
        'unit' => 'Pcs',
        'type' => 'goods',
        'status' => 'active',
    ]);

    $this->assertDatabaseHas('products', ['product_code' => 'LAB-PRODUCT-002']);
});

test('required fields are validated', function () {
    $user = User::factory()->create();

    $this->actingAs($user)
        ->post(route('products.store'), [])
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

test('brand and unit accept the Other option', function () {
    $user = User::factory()->create();

    $response = $this->actingAs($user)
        ->post(route('products.store'), [
            'name' => 'MCB 1 Phase 10A',
            'reference_number' => 'REF-00012345',
            'descriptions' => 'Description',
            'brand' => 'Other',
            'unit' => 'Other',
            'type' => 'goods',
            'status' => 'active',
        ]);

    $response->assertSessionHasNoErrors();

    $this->assertDatabaseHas('products', [
        'brand' => 'Other',
        'unit' => 'Other',
    ]);
});

test('brand must be one of the allowed options', function () {
    $user = User::factory()->create();

    $this->actingAs($user)
        ->post(route('products.store'), [
            'name' => 'MCB 1 Phase 10A',
            'reference_number' => 'REF-00012345',
            'descriptions' => 'Description',
            'brand' => 'Unknown Brand',
            'unit' => 'Pcs',
            'type' => 'goods',
            'status' => 'active',
        ])
        ->assertSessionHasErrors('brand');
});

test('type must be goods or service', function () {
    $user = User::factory()->create();

    $this->actingAs($user)
        ->post(route('products.store'), [
            'name' => 'MCB 1 Phase 10A',
            'reference_number' => 'REF-00012345',
            'descriptions' => 'Description',
            'brand' => 'Schneider Electric',
            'unit' => 'Pcs',
            'type' => 'consumable',
            'status' => 'active',
        ])
        ->assertSessionHasErrors('type');
});

test('status must be active or inactive', function () {
    $user = User::factory()->create();

    $this->actingAs($user)
        ->post(route('products.store'), [
            'name' => 'MCB 1 Phase 10A',
            'reference_number' => 'REF-00012345',
            'descriptions' => 'Description',
            'brand' => 'Schneider Electric',
            'unit' => 'Pcs',
            'type' => 'goods',
            'status' => 'archived',
        ])
        ->assertSessionHasErrors('status');
});

test('guests cannot create products', function () {
    $this->get(route('products.create'))
        ->assertRedirect(route('login'));

    $this->post(route('products.store'), [])
        ->assertRedirect(route('login'));
});
