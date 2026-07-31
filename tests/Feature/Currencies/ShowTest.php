<?php

use App\Models\Currency;
use App\Models\User;
use Inertia\Testing\AssertableInertia as Assert;

test('currency detail page is displayed', function () {
    $user = User::factory()->create();
    $currency = Currency::factory()->create(['name' => 'US Dollar']);

    $this->actingAs($user)
        ->get(route('currencies.show', $currency))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('currencies/show')
            ->where('currency.uuid', $currency->uuid)
            ->where('currency.name', 'US Dollar'),
        );
});

test('currency detail page is resolved by uuid, not the numeric id', function () {
    $user = User::factory()->create();
    $currency = Currency::factory()->create();

    $this->actingAs($user)
        ->get(route('currencies.show', $currency))
        ->assertOk();

    expect(route('currencies.show', $currency))->toContain($currency->uuid);
});

test('trashed currencies are not found', function () {
    $user = User::factory()->create();
    $currency = Currency::factory()->create();
    $currency->delete();

    $this->actingAs($user)
        ->get(route('currencies.show', $currency))
        ->assertNotFound();
});

test('guests cannot view a currency', function () {
    $currency = Currency::factory()->create();

    $this->get(route('currencies.show', $currency))
        ->assertRedirect(route('login'));
});
