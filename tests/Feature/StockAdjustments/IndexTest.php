<?php

use App\Models\User;
use Inertia\Testing\AssertableInertia as Assert;

test('stock adjustments index page is displayed', function () {
    $user = User::factory()->create();

    $this->actingAs($user)
        ->get(route('stock-adjustments.index'))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('stock-adjustments/index'),
        );
});

test('stock adjustments create page is displayed', function () {
    $user = User::factory()->create();

    $this->actingAs($user)
        ->get(route('stock-adjustments.create'))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('stock-adjustments/create'),
        );
});

test('guests cannot view stock adjustments', function () {
    $this->get(route('stock-adjustments.index'))
        ->assertRedirect(route('login'));
});
