<?php

use App\Models\User;
use Inertia\Testing\AssertableInertia as Assert;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;

test('role create page is displayed', function () {
    $user = User::factory()->create();

    $this->actingAs($user)
        ->get(route('roles.create'))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('roles/create'),
        );
});

test('role can be created with permissions', function () {
    $user = User::factory()->create();
    $permission = Permission::findOrCreate('job-titles.view', 'web');

    $response = $this->actingAs($user)
        ->post(route('roles.store'), [
            'name' => 'Warehouse Staff',
            'permissions' => [$permission->id],
        ]);

    $response->assertSessionHasNoErrors();

    $role = Role::where('name', 'Warehouse Staff')->firstOrFail();
    expect($role->hasPermissionTo($permission))->toBeTrue();
});

test('name is required', function () {
    $user = User::factory()->create();

    $this->actingAs($user)
        ->post(route('roles.store'), [
            'name' => '',
        ])
        ->assertSessionHasErrors('name');
});

test('name must be unique', function () {
    $user = User::factory()->create();
    Role::create(['name' => 'Warehouse Staff', 'guard_name' => 'web']);

    $this->actingAs($user)
        ->post(route('roles.store'), [
            'name' => 'Warehouse Staff',
        ])
        ->assertSessionHasErrors('name');
});

test('guests cannot create roles', function () {
    $this->post(route('roles.store'), [
        'name' => 'Warehouse Staff',
    ])->assertRedirect(route('login'));
});
