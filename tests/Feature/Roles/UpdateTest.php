<?php

use App\Models\User;
use Inertia\Testing\AssertableInertia as Assert;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;

test('role edit page is displayed', function () {
    $user = User::factory()->create();
    $role = Role::create(['name' => 'Warehouse Staff', 'guard_name' => 'web']);

    $this->actingAs($user)
        ->get(route('roles.edit', $role))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('roles/edit')
            ->where('role.name', 'Warehouse Staff'),
        );
});

test('role can be updated', function () {
    $user = User::factory()->create();
    $role = Role::create(['name' => 'Warehouse Staff', 'guard_name' => 'web']);
    $permission = Permission::findOrCreate('job-titles.view', 'web');

    $response = $this->actingAs($user)
        ->put(route('roles.update', $role), [
            'name' => 'Senior Warehouse Staff',
            'permissions' => [$permission->id],
        ]);

    $response->assertSessionHasNoErrors();

    $role->refresh();
    expect($role->name)->toBe('Senior Warehouse Staff');
    expect($role->hasPermissionTo($permission))->toBeTrue();
});

test('name must be unique except for itself', function () {
    $user = User::factory()->create();
    $role = Role::create(['name' => 'Warehouse Staff', 'guard_name' => 'web']);

    $this->actingAs($user)
        ->put(route('roles.update', $role), [
            'name' => 'Warehouse Staff',
        ])
        ->assertSessionHasNoErrors();
});

test('name must be unique against other roles', function () {
    $user = User::factory()->create();
    Role::create(['name' => 'Editor', 'guard_name' => 'web']);
    $role = Role::create(['name' => 'Warehouse Staff', 'guard_name' => 'web']);

    $this->actingAs($user)
        ->put(route('roles.update', $role), [
            'name' => 'Editor',
        ])
        ->assertSessionHasErrors('name');
});

test('guests cannot edit or update roles', function () {
    $role = Role::create(['name' => 'Warehouse Staff', 'guard_name' => 'web']);

    $this->get(route('roles.edit', $role))
        ->assertRedirect(route('login'));

    $this->put(route('roles.update', $role), [
        'name' => 'Warehouse Staff',
    ])->assertRedirect(route('login'));
});
