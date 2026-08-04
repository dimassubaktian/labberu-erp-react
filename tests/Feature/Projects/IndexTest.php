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

test('projects can be searched by project code', function () {
    $user = User::factory()->create();
    $match = Project::factory()->create(['name' => 'Warehouse Automation']);
    Project::factory()->create(['name' => 'Panel Retrofit']);

    $this->actingAs($user)
        ->get(route('projects.index', ['search' => $match->project_code]))
        ->assertInertia(fn (Assert $page) => $page
            ->has('projects.data', 1)
            ->where('projects.data.0.project_code', $match->project_code),
        );
});

test('projects can be searched by name', function () {
    $user = User::factory()->create();
    Project::factory()->create(['name' => 'Warehouse Automation']);
    Project::factory()->create(['name' => 'Panel Retrofit']);

    $this->actingAs($user)
        ->get(route('projects.index', ['search' => 'Panel']))
        ->assertInertia(fn (Assert $page) => $page
            ->has('projects.data', 1)
            ->where('projects.data.0.name', 'Panel Retrofit'),
        );
});

test('projects can be filtered by status', function () {
    $user = User::factory()->create();
    Project::factory()->create(['status' => 'completed']);
    Project::factory()->create(['status' => 'in_progress']);

    $this->actingAs($user)
        ->get(route('projects.index', ['status' => 'completed']))
        ->assertInertia(fn (Assert $page) => $page
            ->has('projects.data', 1)
            ->where('projects.data.0.status', 'completed'),
        );
});

test('projects can be filtered by priority', function () {
    $user = User::factory()->create();
    Project::factory()->create(['priority' => 'urgent']);
    Project::factory()->create(['priority' => 'low']);

    $this->actingAs($user)
        ->get(route('projects.index', ['priority' => 'urgent']))
        ->assertInertia(fn (Assert $page) => $page
            ->has('projects.data', 1)
            ->where('projects.data.0.priority', 'urgent'),
        );
});

test('projects can be filtered by status and priority together', function () {
    $user = User::factory()->create();
    $match = Project::factory()->create(['status' => 'completed', 'priority' => 'urgent']);
    Project::factory()->create(['status' => 'completed', 'priority' => 'low']);
    Project::factory()->create(['status' => 'in_progress', 'priority' => 'urgent']);

    $this->actingAs($user)
        ->get(route('projects.index', ['status' => 'completed', 'priority' => 'urgent']))
        ->assertInertia(fn (Assert $page) => $page
            ->has('projects.data', 1)
            ->where('projects.data.0.project_code', $match->project_code),
        );
});

test('projects can be sorted by request date ascending', function () {
    $user = User::factory()->create();
    $older = Project::factory()->create(['request_date' => now()->subDays(10)]);
    $newer = Project::factory()->create(['request_date' => now()]);

    $this->actingAs($user)
        ->get(route('projects.index', ['sort' => 'asc']))
        ->assertInertia(fn (Assert $page) => $page
            ->where('projects.data.0.project_code', $older->project_code)
            ->where('projects.data.1.project_code', $newer->project_code),
        );
});

test('projects default to sorting by request date descending', function () {
    $user = User::factory()->create();
    $older = Project::factory()->create(['request_date' => now()->subDays(10)]);
    $newer = Project::factory()->create(['request_date' => now()]);

    $this->actingAs($user)
        ->get(route('projects.index'))
        ->assertInertia(fn (Assert $page) => $page
            ->where('projects.data.0.project_code', $newer->project_code)
            ->where('projects.data.1.project_code', $older->project_code),
        );
});
