<?php

use App\Models\User;

test('user can be deleted', function () {
    $user = User::factory()->create();
    $target = User::factory()->create();

    $response = $this->actingAs($user)
        ->delete(route('users.destroy', $target));

    $response->assertRedirect(route('users.index'));

    $this->assertSoftDeleted($target);
});

test('a user cannot delete their own account', function () {
    $user = User::factory()->create();

    $response = $this->actingAs($user)
        ->from(route('users.show', $user))
        ->delete(route('users.destroy', $user));

    $response->assertRedirect(route('users.show', $user));

    $this->assertNotSoftDeleted($user);
});

test('guests cannot delete users', function () {
    $target = User::factory()->create();

    $this->delete(route('users.destroy', $target))
        ->assertRedirect(route('login'));

    $this->assertNotSoftDeleted($target);
});
