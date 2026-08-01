<?php

use App\Models\Customer;
use App\Models\User;

test('customers can be searched by name', function () {
    $user = User::factory()->create();
    Customer::factory()->create(['name' => 'Nusalink Bridge']);
    Customer::factory()->create(['name' => 'Acme Corp']);

    $this->actingAs($user)
        ->getJson(route('customers.search', ['q' => 'Nusalink']))
        ->assertOk()
        ->assertJsonCount(1, 'data')
        ->assertJsonFragment(['name' => 'Nusalink Bridge']);
});

test('customers can be searched by customer code', function () {
    $user = User::factory()->create();
    $customer = Customer::factory()->create(['name' => 'Nusalink Bridge']);
    Customer::factory()->create(['name' => 'Acme Corp']);

    $this->actingAs($user)
        ->getJson(route('customers.search', ['q' => $customer->customer_code]))
        ->assertOk()
        ->assertJsonCount(1, 'data')
        ->assertJsonFragment(['id' => $customer->id]);
});

test('empty query returns customers up to the limit', function () {
    $user = User::factory()->create();
    Customer::factory()->count(25)->create();

    $response = $this->actingAs($user)
        ->getJson(route('customers.search'))
        ->assertOk();

    expect($response->json('data'))->toHaveCount(20);
});

test('trashed customers are not returned by search', function () {
    $user = User::factory()->create();
    Customer::factory()->create(['name' => 'Deleted Co'])->delete();

    $this->actingAs($user)
        ->getJson(route('customers.search', ['q' => 'Deleted']))
        ->assertJsonCount(0, 'data');
});

test('guests cannot search customers', function () {
    $this->getJson(route('customers.search'))
        ->assertUnauthorized();
});
