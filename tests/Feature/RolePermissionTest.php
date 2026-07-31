<?php

use App\Models\User;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;

test('user can be assigned a role that grants a permission', function () {
    $role = Role::create(['name' => 'admin']);
    $permission = Permission::create(['name' => 'manage users']);
    $role->givePermissionTo($permission);

    $user = User::factory()->create();
    $user->assignRole('admin');

    expect($user->hasRole('admin'))->toBeTrue();
    expect($user->hasPermissionTo('manage users'))->toBeTrue();
});

test('user without the role does not have its permissions', function () {
    $role = Role::create(['name' => 'admin']);
    $permission = Permission::create(['name' => 'manage users']);
    $role->givePermissionTo($permission);

    $user = User::factory()->create();

    expect($user->hasRole('admin'))->toBeFalse();
    expect($user->hasPermissionTo('manage users'))->toBeFalse();
});
