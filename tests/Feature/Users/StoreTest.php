<?php

use App\Models\User;
use App\Models\Workforce;
use Inertia\Testing\AssertableInertia as Assert;
use Spatie\Permission\Models\Role;

test('user create page is displayed', function () {
    $user = User::factory()->create();

    $this->actingAs($user)
        ->get(route('users.create'))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('users/create'),
        );
});

test('user can be created', function () {
    $user = User::factory()->create();

    $response = $this->actingAs($user)
        ->post(route('users.store'), [
            'name' => 'Jane Doe',
            'email' => 'jane.doe@example.com',
            'password' => 'password',
            'password_confirmation' => 'password',
            'status' => 'active',
        ]);

    $response
        ->assertSessionHasNoErrors()
        ->assertRedirect();

    $this->assertDatabaseHas('users', [
        'name' => 'Jane Doe',
        'email' => 'jane.doe@example.com',
        'status' => 'active',
    ]);
});

test('user can be created with a linked workforce and roles', function () {
    $user = User::factory()->create();
    $workforce = Workforce::factory()->create();
    $role = Role::create(['name' => 'Editor', 'guard_name' => 'web']);

    $response = $this->actingAs($user)
        ->post(route('users.store'), [
            'name' => 'Jane Doe',
            'email' => 'jane.doe@example.com',
            'password' => 'password',
            'password_confirmation' => 'password',
            'status' => 'active',
            'workforce_id' => $workforce->id,
            'roles' => [$role->id],
        ]);

    $response->assertSessionHasNoErrors();

    $newUser = User::where('email', 'jane.doe@example.com')->firstOrFail();

    $this->assertDatabaseHas('workforces', [
        'id' => $workforce->id,
        'user_id' => $newUser->id,
    ]);

    expect($newUser->hasRole('Editor'))->toBeTrue();
});

test('workforce already linked to another user cannot be linked again', function () {
    $user = User::factory()->create();
    $existingUser = User::factory()->create();
    $workforce = Workforce::factory()->create(['user_id' => $existingUser->id]);

    $this->actingAs($user)
        ->post(route('users.store'), [
            'name' => 'Jane Doe',
            'email' => 'jane.doe@example.com',
            'password' => 'password',
            'password_confirmation' => 'password',
            'status' => 'active',
            'workforce_id' => $workforce->id,
        ])
        ->assertSessionHasErrors('workforce_id');
});

test('name is required', function () {
    $user = User::factory()->create();

    $this->actingAs($user)
        ->post(route('users.store'), [
            'name' => '',
            'email' => 'jane.doe@example.com',
            'password' => 'password',
            'password_confirmation' => 'password',
            'status' => 'active',
        ])
        ->assertSessionHasErrors('name');
});

test('email must be unique', function () {
    $user = User::factory()->create();
    User::factory()->create(['email' => 'jane.doe@example.com']);

    $this->actingAs($user)
        ->post(route('users.store'), [
            'name' => 'Jane Doe',
            'email' => 'jane.doe@example.com',
            'password' => 'password',
            'password_confirmation' => 'password',
            'status' => 'active',
        ])
        ->assertSessionHasErrors('email');
});

test('email of a soft-deleted user can be reused', function () {
    $user = User::factory()->create();
    $trashed = User::factory()->create(['email' => 'jane.doe@example.com']);
    $trashed->delete();

    $response = $this->actingAs($user)
        ->post(route('users.store'), [
            'name' => 'Jane Doe',
            'email' => 'jane.doe@example.com',
            'password' => 'password',
            'password_confirmation' => 'password',
            'status' => 'active',
        ]);

    $response->assertSessionHasNoErrors();

    $this->assertDatabaseHas('users', [
        'email' => 'jane.doe@example.com',
        'deleted_at' => null,
    ]);
});

test('password confirmation must match', function () {
    $user = User::factory()->create();

    $this->actingAs($user)
        ->post(route('users.store'), [
            'name' => 'Jane Doe',
            'email' => 'jane.doe@example.com',
            'password' => 'password',
            'password_confirmation' => 'different',
            'status' => 'active',
        ])
        ->assertSessionHasErrors('password');
});

test('status must be active or inactive', function () {
    $user = User::factory()->create();

    $this->actingAs($user)
        ->post(route('users.store'), [
            'name' => 'Jane Doe',
            'email' => 'jane.doe@example.com',
            'password' => 'password',
            'password_confirmation' => 'password',
            'status' => 'archived',
        ])
        ->assertSessionHasErrors('status');
});

test('guests cannot create users', function () {
    $this->post(route('users.store'), [
        'name' => 'Jane Doe',
        'email' => 'jane.doe@example.com',
        'password' => 'password',
        'password_confirmation' => 'password',
        'status' => 'active',
    ])->assertRedirect(route('login'));
});
