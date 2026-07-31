<?php

use App\Models\Currency;
use App\Models\User;
use Inertia\Testing\AssertableInertia as Assert;

test('currency create page is displayed', function () {
    $user = User::factory()->create();

    $this->actingAs($user)
        ->get(route('currencies.create'))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('currencies/create'),
        );
});

test('currency can be created', function () {
    $user = User::factory()->create();

    $response = $this->actingAs($user)
        ->post(route('currencies.store'), [
            'iso_code' => 'usd',
            'name' => 'US Dollar',
            'symbol' => '$',
            'status' => 'active',
        ]);

    $response
        ->assertSessionHasNoErrors()
        ->assertRedirect(route('currencies.index'));

    $this->assertDatabaseHas('currencies', [
        'iso_code' => 'USD',
        'name' => 'US Dollar',
        'symbol' => '$',
        'status' => 'active',
    ]);
});

test('iso code is normalized to uppercase', function () {
    $user = User::factory()->create();

    $this->actingAs($user)->post(route('currencies.store'), [
        'iso_code' => 'idr',
        'name' => 'Indonesian Rupiah',
        'status' => 'active',
    ]);

    $this->assertDatabaseHas('currencies', ['iso_code' => 'IDR']);
});

test('required fields are validated', function () {
    $user = User::factory()->create();

    $this->actingAs($user)
        ->post(route('currencies.store'), [])
        ->assertSessionHasErrors(['iso_code', 'name', 'status']);
});

test('iso code must be exactly 3 letters', function () {
    $user = User::factory()->create();

    $this->actingAs($user)
        ->post(route('currencies.store'), [
            'iso_code' => 'USDX',
            'name' => 'US Dollar',
            'status' => 'active',
        ])
        ->assertSessionHasErrors('iso_code');
});

test('status must be active or inactive', function () {
    $user = User::factory()->create();

    $this->actingAs($user)
        ->post(route('currencies.store'), [
            'iso_code' => 'USD',
            'name' => 'US Dollar',
            'status' => 'archived',
        ])
        ->assertSessionHasErrors('status');
});

test('iso code must be unique', function () {
    $user = User::factory()->create();
    Currency::factory()->create(['iso_code' => 'USD']);

    $this->actingAs($user)
        ->post(route('currencies.store'), [
            'iso_code' => 'USD',
            'name' => 'US Dollar',
            'status' => 'active',
        ])
        ->assertSessionHasErrors('iso_code');
});

test('iso code of a soft-deleted currency can be reused', function () {
    $user = User::factory()->create();
    $trashed = Currency::factory()->create(['iso_code' => 'USD']);
    $trashed->delete();

    $response = $this->actingAs($user)
        ->post(route('currencies.store'), [
            'iso_code' => 'USD',
            'name' => 'US Dollar',
            'status' => 'active',
        ]);

    $response
        ->assertSessionHasNoErrors()
        ->assertRedirect(route('currencies.index'));

    $this->assertDatabaseHas('currencies', [
        'iso_code' => 'USD',
        'deleted_at' => null,
    ]);
});

test('guests cannot create currencies', function () {
    $this->get(route('currencies.create'))
        ->assertRedirect(route('login'));

    $this->post(route('currencies.store'), [])
        ->assertRedirect(route('login'));
});
