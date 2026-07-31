<?php

use App\Models\Project;
use App\Models\User;
use Inertia\Testing\AssertableInertia as Assert;

test('projects index page is displayed', function () {
    $user = User::factory()->create();
    Project::factory()->create(['name' => 'Warehouse Automation']);
    Project::factory()->create(['name' => 'Panel Retrofit']);

    $this->actingAs($user)
        ->get(route('projects.index'))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('projects/index')
            ->has('projects.data', 2),
        );
});

test('trashed projects are not listed', function () {
    $user = User::factory()->create();
    Project::factory()->create();
    Project::factory()->create()->delete();

    $this->actingAs($user)
        ->get(route('projects.index'))
        ->assertInertia(fn (Assert $page) => $page
            ->has('projects.data', 1),
        );
});

test('guests cannot view projects', function () {
    $this->get(route('projects.index'))
        ->assertRedirect(route('login'));
});
