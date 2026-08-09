<?php

use App\Models\Customer;
use App\Models\User;

test('a customer can be quick-created and returned as json', function () {
    $user = User::factory()->create();

    $response = $this->actingAs($user)
        ->postJson(route('customers.quick-create'), [
            'name' => 'Nusalink Bridge',
            'attention' => 'Jane Doe',
            'phone' => '021-5551234',
            'address' => 'Jl. Sudirman No. 1',
        ]);

    $customer = Customer::sole();

    $response->assertCreated()
        ->assertJson([
            'data' => [
                'id' => $customer->id,
                'name' => 'Nusalink Bridge',
                'customer_code' => $customer->customer_code,
            ],
        ]);

    $this->assertDatabaseHas('customers', [
        'name' => 'Nusalink Bridge',
        'attention' => 'Jane Doe',
        'phone' => '021-5551234',
    ]);
});

test('name is required to quick-create a customer', function () {
    $user = User::factory()->create();

    $this->actingAs($user)
        ->postJson(route('customers.quick-create'), [])
        ->assertUnprocessable()
        ->assertJsonValidationErrors(['name']);
});

test('users without the customers.create permission cannot quick-create a customer', function () {
    $user = User::factory()->create();
    $this->actingAs($user);
    $user->syncPermissions([]);

    $this->postJson(route('customers.quick-create'), ['name' => 'Nusalink Bridge'])
        ->assertForbidden();
});

test('guests cannot quick-create customers', function () {
    $this->postJson(route('customers.quick-create'), ['name' => 'Nusalink Bridge'])
        ->assertUnauthorized();
});
