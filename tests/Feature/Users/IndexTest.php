<?php

use App\Models\User;
use Inertia\Testing\AssertableInertia as Assert;

test('users index page is displayed', function () {
    $user = User::factory()->create();
    User::factory()->create();
    User::factory()->create();

    $this->actingAs($user)
        ->get(route('users.index'))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('users/index')
            ->has('users.data', 3),
        );
});

test('trashed users are not listed', function () {
    $user = User::factory()->create();
    User::factory()->create()->delete();

    $this->actingAs($user)
        ->get(route('users.index'))
        ->assertInertia(fn (Assert $page) => $page
            ->has('users.data', 1),
        );
});

test('guests cannot view users', function () {
    $this->get(route('users.index'))
        ->assertRedirect(route('login'));
});

test('users without the users.view permission cannot view users', function () {
    $user = User::factory()->create();

    $this->actingAs($user);
    $user->syncPermissions([]);

    $this->get(route('users.index'))
        ->assertForbidden();
});
