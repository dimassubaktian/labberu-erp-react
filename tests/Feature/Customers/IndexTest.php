<?php

use App\Models\Customer;
use App\Models\User;
use Inertia\Testing\AssertableInertia as Assert;

test('customers index page is displayed', function () {
    $user = User::factory()->create();
    Customer::factory()->create(['name' => 'Nusalink Bridge']);
    Customer::factory()->create(['name' => 'Acme Corp']);

    $this->actingAs($user)
        ->get(route('customers.index'))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('customers/index')
            ->has('customers.data', 2),
        );
});

test('trashed customers are not listed', function () {
    $user = User::factory()->create();
    Customer::factory()->create();
    Customer::factory()->create()->delete();

    $this->actingAs($user)
        ->get(route('customers.index'))
        ->assertInertia(fn (Assert $page) => $page
            ->has('customers.data', 1),
        );
});

test('guests cannot view customers', function () {
    $this->get(route('customers.index'))
        ->assertRedirect(route('login'));
});
