<?php

use App\Models\Currency;
use App\Models\User;
use Inertia\Testing\AssertableInertia as Assert;

test('currencies index page is displayed', function () {
    $user = User::factory()->create();
    Currency::factory()->create(['name' => 'US Dollar']);
    Currency::factory()->create(['name' => 'Euro']);

    $this->actingAs($user)
        ->get(route('currencies.index'))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('currencies/index')
            ->has('currencies.data', 2),
        );
});

test('trashed currencies are not listed', function () {
    $user = User::factory()->create();
    Currency::factory()->create();
    Currency::factory()->create()->delete();

    $this->actingAs($user)
        ->get(route('currencies.index'))
        ->assertInertia(fn (Assert $page) => $page
            ->has('currencies.data', 1),
        );
});

test('guests cannot view currencies', function () {
    $this->get(route('currencies.index'))
        ->assertRedirect(route('login'));
});
