<?php

use App\Models\User;
use Inertia\Testing\AssertableInertia as Assert;
use Spatie\Permission\Models\Role;

test('a super admin can view the design reference', function () {
    $user = User::factory()->create();
    $this->actingAs($user);
    $user->assignRole(Role::findOrCreate('Super Admin', 'web'));

    $this->get(route('design-reference'))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page->component('design-reference'));
});

test('a user without the Super Admin role cannot view the design reference', function () {
    $user = User::factory()->create();
    $this->actingAs($user);
    $user->assignRole(Role::findOrCreate('Admin', 'web'));

    $this->get(route('design-reference'))->assertForbidden();
});

test('having every permission is not enough without the role', function () {
    $user = User::factory()->create();

    // actingAs grants the full permission set, so this proves the route is role-gated.
    $this->actingAs($user)
        ->get(route('design-reference'))
        ->assertForbidden();
});

test('guests are redirected to login', function () {
    $this->get(route('design-reference'))->assertRedirect(route('login'));
});
