<?php

use App\Models\Tax;
use App\Models\User;
use Inertia\Testing\AssertableInertia as Assert;

test('taxes index page is displayed', function () {
    $user = User::factory()->create();
    Tax::factory()->create(['name' => 'Value Added Tax']);
    Tax::factory()->create(['name' => 'Income Tax']);

    $this->actingAs($user)
        ->get(route('taxes.index'))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('taxes/index')
            ->has('taxes.data', 2),
        );
});

test('trashed taxes are not listed', function () {
    $user = User::factory()->create();
    Tax::factory()->create();
    Tax::factory()->create()->delete();

    $this->actingAs($user)
        ->get(route('taxes.index'))
        ->assertInertia(fn (Assert $page) => $page
            ->has('taxes.data', 1),
        );
});

test('guests cannot view taxes', function () {
    $this->get(route('taxes.index'))
        ->assertRedirect(route('login'));
});
