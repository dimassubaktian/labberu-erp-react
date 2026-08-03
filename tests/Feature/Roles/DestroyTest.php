<?php

use App\Models\User;
use Spatie\Permission\Models\Role;

test('role can be deleted', function () {
    $user = User::factory()->create();
    $role = Role::create(['name' => 'Warehouse Staff', 'guard_name' => 'web']);

    $response = $this->actingAs($user)
        ->delete(route('roles.destroy', $role));

    $response->assertRedirect(route('roles.index'));

    expect(Role::find($role->id))->toBeNull();
});

test('role assigned to users cannot be deleted', function () {
    $user = User::factory()->create();
    $role = Role::create(['name' => 'Warehouse Staff', 'guard_name' => 'web']);
    $assignedUser = User::factory()->create();
    $assignedUser->assignRole($role);

    $response = $this->actingAs($user)
        ->from(route('roles.show', $role))
        ->delete(route('roles.destroy', $role));

    $response->assertRedirect(route('roles.show', $role));

    expect(Role::find($role->id))->not->toBeNull();
});

test('guests cannot delete roles', function () {
    $role = Role::create(['name' => 'Warehouse Staff', 'guard_name' => 'web']);

    $this->delete(route('roles.destroy', $role))
        ->assertRedirect(route('login'));

    expect(Role::find($role->id))->not->toBeNull();
});
