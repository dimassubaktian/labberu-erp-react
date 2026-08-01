<?php

use App\Models\Project;
use App\Models\Quotation;
use App\Models\User;
use Inertia\Testing\AssertableInertia as Assert;

test('project detail page is displayed', function () {
    $user = User::factory()->create();
    $project = Project::factory()->create(['name' => 'Panel Retrofit']);

    $this->actingAs($user)
        ->get(route('projects.show', $project))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('projects/show')
            ->where('project.uuid', $project->uuid)
            ->where('project.name', 'Panel Retrofit')
            ->where('project.customer.id', $project->customer_id),
        );
});

test('project detail page includes the project\'s quotations', function () {
    $user = User::factory()->create();
    $project = Project::factory()->create();
    $quotation = Quotation::factory()->create(['project_id' => $project->id]);

    $this->actingAs($user)
        ->get(route('projects.show', $project))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('projects/show')
            ->has('quotations', 1)
            ->where('quotations.0.id', $quotation->id)
            ->where('quotations.0.quotation_code', $quotation->quotation_code),
        );
});

test('project detail page is resolved by uuid, not the numeric id', function () {
    $user = User::factory()->create();
    $project = Project::factory()->create();

    $this->actingAs($user)
        ->get(route('projects.show', $project))
        ->assertOk();

    expect(route('projects.show', $project))->toContain($project->uuid);
});

test('trashed projects are not found', function () {
    $user = User::factory()->create();
    $project = Project::factory()->create();
    $project->delete();

    $this->actingAs($user)
        ->get(route('projects.show', $project))
        ->assertNotFound();
});

test('guests cannot view a project', function () {
    $project = Project::factory()->create();

    $this->get(route('projects.show', $project))
        ->assertRedirect(route('login'));
});
