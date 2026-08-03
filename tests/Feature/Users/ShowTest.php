<?php

use App\Models\User;
use App\Models\Workforce;
use Inertia\Testing\AssertableInertia as Assert;
use Spatie\Permission\Models\Role;

test('user detail page is displayed', function () {
    $user = User::factory()->create();
    $workforce = Workforce::factory()->create();
    $target = User::factory()->create(['name' => 'Jane Doe']);
    $workforce->update(['user_id' => $target->id]);
    $role = Role::create(['name' => 'Editor', 'guard_name' => 'web']);
    $target->assignRole($role);

    $this->actingAs($user)
        ->get(route('users.show', $target))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('users/show')
            ->where('user.uuid', $target->uuid)
            ->where('user.name', 'Jane Doe')
            ->where('user.workforce.id', $workforce->id)
            ->has('user.roles', 1),
        );
});

test('user detail page is resolved by uuid, not the numeric id', function () {
    $user = User::factory()->create();
    $target = User::factory()->create();

    $this->actingAs($user)
        ->get(route('users.show', $target))
        ->assertOk();

    expect(route('users.show', $target))->toContain($target->uuid);
});

test('trashed users are not found', function () {
    $user = User::factory()->create();
    $target = User::factory()->create();
    $target->delete();

    $this->actingAs($user)
        ->get(route('users.show', $target))
        ->assertNotFound();
});

test('guests cannot view a user', function () {
    $target = User::factory()->create();

    $this->get(route('users.show', $target))
        ->assertRedirect(route('login'));
});
