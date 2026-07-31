<?php

use App\Models\User;
use App\Models\Workforce;
use Inertia\Testing\AssertableInertia as Assert;

test('workforces index page is displayed', function () {
    $user = User::factory()->create();
    Workforce::factory()->create(['full_name' => 'Jane Doe']);
    Workforce::factory()->create(['full_name' => 'John Smith']);

    $this->actingAs($user)
        ->get(route('workforces.index'))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('workforces/index')
            ->has('workforces.data', 2)
            ->has('workforces.data.0.job_title.name'),
        );
});

test('trashed workforces are not listed', function () {
    $user = User::factory()->create();
    Workforce::factory()->create();
    Workforce::factory()->create()->delete();

    $this->actingAs($user)
        ->get(route('workforces.index'))
        ->assertInertia(fn (Assert $page) => $page
            ->has('workforces.data', 1),
        );
});

test('guests cannot view workforces', function () {
    $this->get(route('workforces.index'))
        ->assertRedirect(route('login'));
});
