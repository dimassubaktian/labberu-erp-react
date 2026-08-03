<?php

use App\Models\Currency;
use App\Models\User;
use Inertia\Testing\AssertableInertia as Assert;

test('currency edit page is displayed', function () {
    $user = User::factory()->create();
    $currency = Currency::factory()->create(['name' => 'US Dollar']);

    $this->actingAs($user)
        ->get(route('currencies.edit', $currency))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('currencies/edit')
            ->where('currency.uuid', $currency->uuid)
            ->where('currency.name', 'US Dollar'),
        );
});

test('currency can be updated', function () {
    $user = User::factory()->create();
    $currency = Currency::factory()->create([
        'iso_code' => 'USD',
        'name' => 'US Dollar',
        'status' => 'active',
    ]);

    $response = $this->actingAs($user)
        ->put(route('currencies.update', $currency), [
            'iso_code' => 'eur',
            'name' => 'Euro',
            'symbol' => '€',
            'status' => 'inactive',
        ]);

    $response
        ->assertSessionHasNoErrors()
        ->assertRedirect(route('currencies.show', $currency));

    $this->assertDatabaseHas('currencies', [
        'id' => $currency->id,
        'iso_code' => 'EUR',
        'name' => 'Euro',
        'symbol' => '€',
        'status' => 'inactive',
    ]);
});

test('iso code must be unique except for itself', function () {
    $user = User::factory()->create();
    $currency = Currency::factory()->create(['iso_code' => 'USD']);

    $this->actingAs($user)
        ->put(route('currencies.update', $currency), [
            'iso_code' => 'usd',
            'name' => $currency->name,
            'status' => 'active',
        ])
        ->assertSessionHasNoErrors();
});

test('iso code must be unique against other currencies', function () {
    $user = User::factory()->create();
    Currency::factory()->create(['iso_code' => 'USD']);
    $currency = Currency::factory()->create(['iso_code' => 'EUR']);

    $this->actingAs($user)
        ->put(route('currencies.update', $currency), [
            'iso_code' => 'USD',
            'name' => $currency->name,
            'status' => 'active',
        ])
        ->assertSessionHasErrors('iso_code');
});

test('marking a currency as base currency unsets the previous base currency', function () {
    $user = User::factory()->create();
    $existingBase = Currency::factory()->baseCurrency()->create(['iso_code' => 'USD']);
    $currency = Currency::factory()->create(['iso_code' => 'EUR']);

    $this->actingAs($user)
        ->put(route('currencies.update', $currency), [
            'iso_code' => $currency->iso_code,
            'name' => $currency->name,
            'status' => 'active',
            'base_currency' => true,
        ])
        ->assertSessionHasNoErrors();

    $this->assertDatabaseHas('currencies', ['id' => $currency->id, 'base_currency' => true]);
    $this->assertDatabaseHas('currencies', ['id' => $existingBase->id, 'base_currency' => false]);
});

test('a currency can be unmarked as base currency', function () {
    $user = User::factory()->create();
    $currency = Currency::factory()->baseCurrency()->create();

    $this->actingAs($user)
        ->put(route('currencies.update', $currency), [
            'iso_code' => $currency->iso_code,
            'name' => $currency->name,
            'status' => 'active',
            'base_currency' => false,
        ])
        ->assertSessionHasNoErrors();

    $this->assertDatabaseHas('currencies', ['id' => $currency->id, 'base_currency' => false]);
});

test('guests cannot edit or update currencies', function () {
    $currency = Currency::factory()->create();

    $this->get(route('currencies.edit', $currency))
        ->assertRedirect(route('login'));

    $this->put(route('currencies.update', $currency), [])
        ->assertRedirect(route('login'));
});
