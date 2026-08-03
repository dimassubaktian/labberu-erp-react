<?php

use App\Models\User;
use Inertia\Testing\AssertableInertia as Assert;

test('stock movements index page is displayed', function () {
    $user = User::factory()->create();

    $this->actingAs($user)
        ->get(route('stock-movements.index'))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('stock-movements/index'),
        );
});

test('guests cannot view stock movements', function () {
    $this->get(route('stock-movements.index'))
        ->assertRedirect(route('login'));
});
