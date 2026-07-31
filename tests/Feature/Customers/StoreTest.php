<?php

use App\Models\Customer;
use App\Models\User;
use Inertia\Testing\AssertableInertia as Assert;

test('customer create page is displayed', function () {
    $user = User::factory()->create();

    $this->actingAs($user)
        ->get(route('customers.create'))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('customers/create'),
        );
});

test('customer can be created', function () {
    $user = User::factory()->create();

    $response = $this->actingAs($user)
        ->post(route('customers.store'), [
            'name' => 'Nusalink Bridge',
            'attention' => 'Jane Doe',
            'phone' => '021-5551234',
            'fax' => '021-5551235',
            'address' => 'Jl. Sudirman No. 1',
            'city' => 'Jakarta',
            'province' => 'DKI Jakarta',
            'country' => 'Indonesia',
            'postal_code' => '10220',
            'remarks' => 'Preferred customer',
        ]);

    $response->assertSessionHasNoErrors();

    $customer = Customer::sole();

    $response->assertRedirect(route('customers.show', $customer));

    $this->assertDatabaseHas('customers', [
        'name' => 'Nusalink Bridge',
        'attention' => 'Jane Doe',
        'phone' => '021-5551234',
        'city' => 'Jakarta',
    ]);
});

test('customer code is generated from the first letter of the name', function () {
    $user = User::factory()->create();

    $this->actingAs($user)->post(route('customers.store'), [
        'name' => 'Nusalink Bridge',
    ]);

    $this->assertDatabaseHas('customers', ['customer_code' => 'N001']);
});

test('only name is required', function () {
    $user = User::factory()->create();

    $response = $this->actingAs($user)
        ->post(route('customers.store'), [
            'name' => 'Acme Corp',
        ]);

    $response->assertSessionHasNoErrors();

    $customer = Customer::sole();

    $response->assertRedirect(route('customers.show', $customer));

    $this->assertDatabaseHas('customers', ['name' => 'Acme Corp']);
});

test('name is required', function () {
    $user = User::factory()->create();

    $this->actingAs($user)
        ->post(route('customers.store'), [])
        ->assertSessionHasErrors(['name']);
});

test('guests cannot create customers', function () {
    $this->get(route('customers.create'))
        ->assertRedirect(route('login'));

    $this->post(route('customers.store'), [])
        ->assertRedirect(route('login'));
});
