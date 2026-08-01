<?php

use App\Models\Project;
use App\Models\User;

test('projects can be searched by name', function () {
    $user = User::factory()->create();
    Project::factory()->create(['name' => 'Warehouse Automation']);
    Project::factory()->create(['name' => 'Panel Retrofit']);

    $this->actingAs($user)
        ->getJson(route('projects.search', ['q' => 'Warehouse']))
        ->assertOk()
        ->assertJsonCount(1, 'data')
        ->assertJsonFragment(['name' => 'Warehouse Automation']);
});

test('projects can be searched by project code', function () {
    $user = User::factory()->create();
    $project = Project::factory()->create(['name' => 'Warehouse Automation']);
    Project::factory()->create(['name' => 'Panel Retrofit']);

    $this->actingAs($user)
        ->getJson(route('projects.search', ['q' => $project->project_code]))
        ->assertOk()
        ->assertJsonCount(1, 'data')
        ->assertJsonFragment(['id' => $project->id]);
});

test('project search results include the customer relation', function () {
    $user = User::factory()->create();
    $project = Project::factory()->create(['name' => 'Warehouse Automation']);

    $response = $this->actingAs($user)
        ->getJson(route('projects.search', ['q' => 'Warehouse']))
        ->assertOk();

    expect($response->json('data.0.customer.id'))->toBe($project->customer_id);
});

test('trashed projects are not returned by search', function () {
    $user = User::factory()->create();
    Project::factory()->create(['name' => 'Deleted Project'])->delete();

    $this->actingAs($user)
        ->getJson(route('projects.search', ['q' => 'Deleted']))
        ->assertJsonCount(0, 'data');
});

test('guests cannot search projects', function () {
    $this->getJson(route('projects.search'))
        ->assertUnauthorized();
});
