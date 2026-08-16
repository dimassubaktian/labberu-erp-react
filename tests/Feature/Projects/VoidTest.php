<?php

use App\Models\Project;
use App\Models\Quotation;
use App\Models\User;

test('a project can be voided with a reason', function () {
    $user = User::factory()->create();
    $project = Project::factory()->create(['status' => 'planning']);

    $this->actingAs($user)
        ->patch(route('projects.void', $project), ['void_reason' => 'Raised against the wrong customer.'])
        ->assertRedirect(route('projects.show', $project));

    $project->refresh();
    expect($project->status)->toBe('voided');
    expect($project->void_reason)->toBe('Raised against the wrong customer.');
});

test('a project with related documents can still be voided', function () {
    $user = User::factory()->create();
    $project = Project::factory()->create(['status' => 'planning']);
    Quotation::factory()->create(['project_id' => $project->id]);

    $this->actingAs($user)
        ->patch(route('projects.void', $project), ['void_reason' => 'Superseded.'])
        ->assertRedirect(route('projects.show', $project));

    expect($project->refresh()->status)->toBe('voided');
});

test('voiding a project requires a reason', function () {
    $user = User::factory()->create();
    $project = Project::factory()->create(['status' => 'planning']);

    $this->actingAs($user)
        ->patch(route('projects.void', $project), [])
        ->assertInvalid('void_reason');

    expect($project->refresh()->status)->toBe('planning');
});

test('a voided project cannot be voided again', function () {
    $user = User::factory()->create();
    $project = Project::factory()->create(['status' => 'voided']);

    $this->actingAs($user)
        ->patch(route('projects.void', $project), ['void_reason' => 'Again.'])
        ->assertForbidden();
});

test('a completed project cannot be voided', function () {
    $user = User::factory()->create();
    $project = Project::factory()->create(['status' => 'completed']);

    $this->actingAs($user)
        ->patch(route('projects.void', $project), ['void_reason' => 'Too late.'])
        ->assertForbidden();
});

test('a voided project status is not recomputed', function () {
    $project = Project::factory()->create(['status' => 'voided']);
    Quotation::factory()->create(['project_id' => $project->id]);

    $project->recomputeStatus();

    expect($project->refresh()->status)->toBe('voided');
});

test('guests cannot void projects', function () {
    $project = Project::factory()->create(['status' => 'planning']);

    $this->patch(route('projects.void', $project), ['void_reason' => 'Nope.'])
        ->assertRedirect(route('login'));

    expect($project->refresh()->status)->toBe('planning');
});
