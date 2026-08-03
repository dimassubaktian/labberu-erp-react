<?php

use App\Models\User;
use Inertia\Testing\AssertableInertia as Assert;
use Spatie\Permission\Models\Role;

test('roles index page is displayed', function () {
    $user = User::factory()->create();
    Role::create(['name' => 'Editor', 'guard_name' => 'web']);
    Role::create(['name' => 'Viewer', 'guard_name' => 'web']);

    $this->actingAs($user)
        ->get(route('roles.index'))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('roles/index')
            ->has('roles.data', 2),
        );
});

test('guests cannot view roles', function () {
    $this->get(route('roles.index'))
        ->assertRedirect(route('login'));
});

test('users without the roles.view permission cannot view roles', function () {
    $user = User::factory()->create();

    $this->actingAs($user);
    $user->syncPermissions([]);

    $this->get(route('roles.index'))
        ->assertForbidden();
});
