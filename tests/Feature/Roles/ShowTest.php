<?php

use App\Models\User;
use Inertia\Testing\AssertableInertia as Assert;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;

test('role detail page is displayed', function () {
    $user = User::factory()->create();
    $permission = Permission::findOrCreate('job-titles.view', 'web');
    $role = Role::create(['name' => 'Warehouse Staff', 'guard_name' => 'web']);
    $role->syncPermissions([$permission]);
    $assignedUser = User::factory()->create();
    $assignedUser->assignRole($role);

    $this->actingAs($user)
        ->get(route('roles.show', $role))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('roles/show')
            ->where('role.name', 'Warehouse Staff')
            ->has('role.permissions', 1)
            ->has('users', 1)
            ->where('users.0.id', $assignedUser->id),
        );
});

test('guests cannot view a role', function () {
    $role = Role::create(['name' => 'Warehouse Staff', 'guard_name' => 'web']);

    $this->get(route('roles.show', $role))
        ->assertRedirect(route('login'));
});
