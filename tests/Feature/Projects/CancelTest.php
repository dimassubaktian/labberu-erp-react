<?php

use App\Models\Project;
use App\Models\User;

test('a project can be cancelled with a reason', function () {
    $user = User::factory()->create();
    $project = Project::factory()->create(['status' => 'planning']);

    $this->actingAs($user)
        ->patch(route('projects.cancel', $project), ['cancel_reason' => 'Customer withdrew the order.'])
        ->assertRedirect(route('projects.show', $project));

    $project->refresh();
    expect($project->status)->toBe('cancelled');
    expect($project->cancel_reason)->toBe('Customer withdrew the order.');
});

test('cancelling a project requires a reason', function () {
    $user = User::factory()->create();
    $project = Project::factory()->create(['status' => 'planning']);

    $this->actingAs($user)
        ->patch(route('projects.cancel', $project), [])
        ->assertInvalid('cancel_reason');

    expect($project->refresh()->status)->toBe('planning');
});

test('a cancelled project cannot be cancelled again', function () {
    $user = User::factory()->create();
    $project = Project::factory()->create(['status' => 'cancelled']);

    $this->actingAs($user)
        ->patch(route('projects.cancel', $project), ['cancel_reason' => 'Again.'])
        ->assertForbidden();
});

test('a completed project cannot be cancelled', function () {
    $user = User::factory()->create();
    $project = Project::factory()->create(['status' => 'completed']);

    $this->actingAs($user)
        ->patch(route('projects.cancel', $project), ['cancel_reason' => 'Too late.'])
        ->assertForbidden();
});

test('guests cannot cancel projects', function () {
    $project = Project::factory()->create();

    $this->patch(route('projects.cancel', $project), ['cancel_reason' => 'Nope.'])
        ->assertRedirect(route('login'));
});
