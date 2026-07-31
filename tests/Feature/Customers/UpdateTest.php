<?php

use App\Models\Customer;
use App\Models\User;
use Inertia\Testing\AssertableInertia as Assert;

test('customer edit page is displayed', function () {
    $user = User::factory()->create();
    $customer = Customer::factory()->create(['name' => 'Nusalink Bridge']);

    $this->actingAs($user)
        ->get(route('customers.edit', $customer))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('customers/edit')
            ->where('customer.uuid', $customer->uuid)
            ->where('customer.name', 'Nusalink Bridge'),
        );
});

test('customer can be updated', function () {
    $user = User::factory()->create();
    $customer = Customer::factory()->create([
        'name' => 'Nusalink Bridge',
        'city' => 'Jakarta',
    ]);

    $response = $this->actingAs($user)
        ->put(route('customers.update', $customer), [
            'name' => 'Nusalink Bridge Corp',
            'attention' => 'John Smith',
            'city' => 'Surabaya',
        ]);

    $response
        ->assertSessionHasNoErrors()
        ->assertRedirect(route('customers.show', $customer));

    $this->assertDatabaseHas('customers', [
        'id' => $customer->id,
        'name' => 'Nusalink Bridge Corp',
        'attention' => 'John Smith',
        'city' => 'Surabaya',
    ]);
});

test('customer code is not changed by an update', function () {
    $user = User::factory()->create();
    $customer = Customer::factory()->create();
    $originalCode = $customer->customer_code;

    $this->actingAs($user)->put(route('customers.update', $customer), [
        'name' => 'Updated Name',
    ]);

    $this->assertDatabaseHas('customers', [
        'id' => $customer->id,
        'customer_code' => $originalCode,
    ]);
});

test('name is required', function () {
    $user = User::factory()->create();
    $customer = Customer::factory()->create();

    $this->actingAs($user)
        ->put(route('customers.update', $customer), [])
        ->assertSessionHasErrors(['name']);
});

test('guests cannot edit or update customers', function () {
    $customer = Customer::factory()->create();

    $this->get(route('customers.edit', $customer))
        ->assertRedirect(route('login'));

    $this->put(route('customers.update', $customer), [])
        ->assertRedirect(route('login'));
});
