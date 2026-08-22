<?php

use App\Models\User;
use App\Models\Workforce;
use Inertia\Testing\AssertableInertia as Assert;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;

test('user edit page is displayed', function () {
    $user = User::factory()->create();
    $target = User::factory()->create(['name' => 'Jane Doe']);

    $this->actingAs($user)
        ->get(route('users.edit', $target))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('users/edit')
            ->where('user.uuid', $target->uuid)
            ->where('user.name', 'Jane Doe'),
        );
});

test('user can be updated without changing the password', function () {
    $user = User::factory()->create();
    $target = User::factory()->create(['name' => 'Jane Doe']);
    $originalPassword = $target->password;

    $response = $this->actingAs($user)
        ->put(route('users.update', $target), [
            'name' => 'Jane Smith',
            'email' => $target->email,
            'password' => '',
            'password_confirmation' => '',
            'status' => 'active',
        ]);

    $response
        ->assertSessionHasNoErrors()
        ->assertRedirect(route('users.show', $target));

    $target->refresh();
    expect($target->name)->toBe('Jane Smith');
    expect($target->password)->toBe($originalPassword);
});

test('user password can be changed', function () {
    $user = User::factory()->create();
    $target = User::factory()->create();
    $originalPassword = $target->password;

    $this->actingAs($user)
        ->put(route('users.update', $target), [
            'name' => $target->name,
            'email' => $target->email,
            'password' => 'new-password',
            'password_confirmation' => 'new-password',
            'status' => 'active',
        ])
        ->assertSessionHasNoErrors();

    expect($target->refresh()->password)->not->toBe($originalPassword);
});

test('linking a user to a workforce sets the workforce user_id', function () {
    $user = User::factory()->create();
    $target = User::factory()->create();
    $workforce = Workforce::factory()->create();

    $this->actingAs($user)
        ->put(route('users.update', $target), [
            'name' => $target->name,
            'email' => $target->email,
            'password' => '',
            'password_confirmation' => '',
            'status' => 'active',
            'workforce_id' => $workforce->id,
        ])
        ->assertSessionHasNoErrors();

    $this->assertDatabaseHas('workforces', [
        'id' => $workforce->id,
        'user_id' => $target->id,
    ]);
});

test('relinking a user to a different workforce unlinks the previous one', function () {
    $user = User::factory()->create();
    $target = User::factory()->create();
    $oldWorkforce = Workforce::factory()->create(['user_id' => $target->id]);
    $newWorkforce = Workforce::factory()->create();

    $this->actingAs($user)
        ->put(route('users.update', $target), [
            'name' => $target->name,
            'email' => $target->email,
            'password' => '',
            'password_confirmation' => '',
            'status' => 'active',
            'workforce_id' => $newWorkforce->id,
        ])
        ->assertSessionHasNoErrors();

    $this->assertDatabaseHas('workforces', ['id' => $oldWorkforce->id, 'user_id' => null]);
    $this->assertDatabaseHas('workforces', ['id' => $newWorkforce->id, 'user_id' => $target->id]);
});

test('unlinking a workforce clears its user_id', function () {
    $user = User::factory()->create();
    $target = User::factory()->create();
    $workforce = Workforce::factory()->create(['user_id' => $target->id]);

    $this->actingAs($user)
        ->put(route('users.update', $target), [
            'name' => $target->name,
            'email' => $target->email,
            'password' => '',
            'password_confirmation' => '',
            'status' => 'active',
        ])
        ->assertSessionHasNoErrors();

    $this->assertDatabaseHas('workforces', ['id' => $workforce->id, 'user_id' => null]);
});

test('roles can be synced on update', function () {
    $user = User::factory()->create();
    $target = User::factory()->create();
    $editor = Role::create(['name' => 'Editor', 'guard_name' => 'web']);
    $viewer = Role::create(['name' => 'Viewer', 'guard_name' => 'web']);
    $target->assignRole($editor);

    $this->actingAs($user)
        ->put(route('users.update', $target), [
            'name' => $target->name,
            'email' => $target->email,
            'password' => '',
            'password_confirmation' => '',
            'status' => 'active',
            'roles' => [$viewer->id],
        ])
        ->assertSessionHasNoErrors();

    $target->refresh();
    expect($target->hasRole('Viewer'))->toBeTrue();
    expect($target->hasRole('Editor'))->toBeFalse();
});

test('a user cannot deactivate their own account', function () {
    $user = User::factory()->create(['status' => 'active']);

    $this->actingAs($user)
        ->put(route('users.update', $user), [
            'name' => $user->name,
            'email' => $user->email,
            'password' => '',
            'password_confirmation' => '',
            'status' => 'inactive',
        ])
        ->assertForbidden();

    expect($user->refresh()->status)->toBe('active');
});

test('a user cannot remove all of their own roles', function () {
    $role = Role::create(['name' => 'Editor', 'guard_name' => 'web']);
    $user = User::factory()->create();
    $user->assignRole($role);

    $this->actingAs($user)
        ->put(route('users.update', $user), [
            'name' => $user->name,
            'email' => $user->email,
            'password' => '',
            'password_confirmation' => '',
            'status' => 'active',
            'roles' => [],
        ])
        ->assertForbidden();

    expect($user->refresh()->hasRole('Editor'))->toBeTrue();
});

test('the last user manager cannot demote their own role', function () {
    Permission::findOrCreate('users.update', 'web');
    $role = Role::create(['name' => 'Manager Role', 'guard_name' => 'web']);
    $role->givePermissionTo('users.update');
    $otherRole = Role::create(['name' => 'Other Role', 'guard_name' => 'web']);

    $user = User::factory()->create();
    $user->assignRole($role);

    $this->actingAs($user);
    // actingAs() grants every permission directly for test convenience (see TestCase) — strip
    // that blanket direct grant so this user's `users.update` access comes only from the role
    // under test, matching how permissions actually flow in the real app.
    $user->syncPermissions([]);

    $this->put(route('users.update', $user), [
        'name' => $user->name,
        'email' => $user->email,
        'password' => '',
        'password_confirmation' => '',
        'status' => 'active',
        'roles' => [$otherRole->id],
    ])->assertRedirect();

    expect($user->refresh()->hasRole('Manager Role'))->toBeTrue();
});

test('a manager role can be reassigned when another user manager remains', function () {
    Permission::findOrCreate('users.update', 'web');
    $role = Role::create(['name' => 'Manager Role', 'guard_name' => 'web']);
    $role->givePermissionTo('users.update');
    $otherRole = Role::create(['name' => 'Other Role', 'guard_name' => 'web']);

    $actor = User::factory()->create();
    $actor->assignRole($role);
    $target = User::factory()->create();
    $target->assignRole($role);

    $this->actingAs($actor)
        ->put(route('users.update', $target), [
            'name' => $target->name,
            'email' => $target->email,
            'password' => '',
            'password_confirmation' => '',
            'status' => 'active',
            'roles' => [$otherRole->id],
        ])
        ->assertSessionHasNoErrors();

    expect($target->refresh()->hasRole('Manager Role'))->toBeFalse();
});

test('name is required', function () {
    $user = User::factory()->create();
    $target = User::factory()->create();

    $this->actingAs($user)
        ->put(route('users.update', $target), [
            'name' => '',
            'email' => $target->email,
            'status' => 'active',
        ])
        ->assertSessionHasErrors('name');
});

test('email must be unique except for itself', function () {
    $user = User::factory()->create();
    $target = User::factory()->create();

    $this->actingAs($user)
        ->put(route('users.update', $target), [
            'name' => $target->name,
            'email' => $target->email,
            'status' => 'active',
        ])
        ->assertSessionHasNoErrors();
});

test('guests cannot edit or update users', function () {
    $target = User::factory()->create();

    $this->get(route('users.edit', $target))
        ->assertRedirect(route('login'));

    $this->put(route('users.update', $target), [
        'name' => 'Jane Doe',
        'email' => $target->email,
        'status' => 'active',
    ])->assertRedirect(route('login'));
});
