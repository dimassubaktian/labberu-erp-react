<?php

use App\Models\User;
use Inertia\Testing\AssertableInertia as Assert;

test('a user with the design-reference permission can view the design reference', function () {
    $user = User::factory()->create();

    // actingAs grants the full permission set, including design-reference.view.
    $this->actingAs($user)
        ->get(route('design-reference'))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page->component('design-reference'));
});

test('a user without the design-reference permission cannot view the design reference', function () {
    $user = User::factory()->create();
    $this->actingAs($user);
    $user->syncPermissions([]);

    $this->get(route('design-reference'))->assertForbidden();
});

test('guests are redirected to login', function () {
    $this->get(route('design-reference'))->assertRedirect(route('login'));
});
