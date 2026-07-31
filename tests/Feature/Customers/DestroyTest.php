<?php

use App\Models\Customer;
use App\Models\User;

test('customer can be deleted', function () {
    $user = User::factory()->create();
    $customer = Customer::factory()->create();

    $response = $this->actingAs($user)
        ->delete(route('customers.destroy', $customer));

    $response->assertRedirect(route('customers.index'));

    $this->assertSoftDeleted($customer);
});

test('guests cannot delete customers', function () {
    $customer = Customer::factory()->create();

    $this->delete(route('customers.destroy', $customer))
        ->assertRedirect(route('login'));

    $this->assertNotSoftDeleted($customer);
});
