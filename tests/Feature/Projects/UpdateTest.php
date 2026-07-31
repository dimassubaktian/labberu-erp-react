<?php

use App\Models\Project;
use App\Models\User;
use App\Models\Workforce;
use Inertia\Testing\AssertableInertia as Assert;

test('project edit page is displayed', function () {
    $user = User::factory()->create();
    $project = Project::factory()->create(['name' => 'Panel Retrofit']);

    $this->actingAs($user)
        ->get(route('projects.edit', $project))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('projects/edit')
            ->where('project.uuid', $project->uuid)
            ->where('project.name', 'Panel Retrofit'),
        );
});

test('project can be updated', function () {
    $user = User::factory()->create();
    $project = Project::factory()->create([
        'name' => 'Panel Retrofit',
        'status' => 'planning',
    ]);
    $workforce = Workforce::factory()->create();

    $response = $this->actingAs($user)
        ->put(route('projects.update', $project), [
            'name' => 'Panel Retrofit Phase 2',
            'customer_id' => $project->customer_id,
            'request_date' => $project->request_date->format('Y-m-d'),
            'person_in_charge_id' => $workforce->id,
            'status' => 'completed',
            'priority' => 'high',
            'completed_at' => '2026-08-20',
            'actual_cost' => '95000000.00',
            'actual_contract_value' => '150000000.00',
        ]);

    $response
        ->assertSessionHasNoErrors()
        ->assertRedirect(route('projects.show', $project));

    $this->assertDatabaseHas('projects', [
        'id' => $project->id,
        'name' => 'Panel Retrofit Phase 2',
        'person_in_charge_id' => $workforce->id,
        'status' => 'completed',
        'priority' => 'high',
        'actual_cost' => '95000000.00',
        'actual_contract_value' => '150000000.00',
    ]);
});

test('project code is not changed by an update', function () {
    $user = User::factory()->create();
    $project = Project::factory()->create();
    $originalCode = $project->project_code;

    $this->actingAs($user)->put(route('projects.update', $project), [
        'name' => 'Updated Name',
        'customer_id' => $project->customer_id,
        'request_date' => $project->request_date->format('Y-m-d'),
        'status' => $project->status,
        'priority' => $project->priority,
    ]);

    $this->assertDatabaseHas('projects', [
        'id' => $project->id,
        'project_code' => $originalCode,
    ]);
});

test('required fields are validated', function () {
    $user = User::factory()->create();
    $project = Project::factory()->create();

    $this->actingAs($user)
        ->put(route('projects.update', $project), [])
        ->assertSessionHasErrors(['name', 'customer_id', 'request_date', 'status', 'priority']);
});

test('customer must exist', function () {
    $user = User::factory()->create();
    $project = Project::factory()->create();

    $this->actingAs($user)
        ->put(route('projects.update', $project), [
            'name' => 'Panel Retrofit',
            'customer_id' => 999,
            'request_date' => '2026-07-01',
            'status' => 'planning',
            'priority' => 'medium',
        ])
        ->assertSessionHasErrors(['customer_id']);
});

test('guests cannot edit or update projects', function () {
    $project = Project::factory()->create();

    $this->get(route('projects.edit', $project))
        ->assertRedirect(route('login'));

    $this->put(route('projects.update', $project), [])
        ->assertRedirect(route('login'));
});
