<?php

use App\Models\Project;
use App\Models\PurchaseOrder;
use App\Models\Quotation;
use App\Models\User;

test('project can be deleted', function () {
    $user = User::factory()->create();
    $project = Project::factory()->create();

    $response = $this->actingAs($user)
        ->delete(route('projects.destroy', $project));

    $response->assertRedirect(route('projects.index'));

    $this->assertSoftDeleted($project);
});

test('a project with quotations cannot be deleted', function () {
    $user = User::factory()->create();
    $project = Project::factory()->create();
    Quotation::factory()->create(['project_id' => $project->id]);

    $this->actingAs($user)
        ->from(route('projects.show', $project))
        ->delete(route('projects.destroy', $project))
        ->assertRedirect(route('projects.show', $project));

    $this->assertNotSoftDeleted($project);
});

test('a project with purchase orders cannot be deleted', function () {
    $user = User::factory()->create();
    $project = Project::factory()->create();
    PurchaseOrder::factory()->create(['project_id' => $project->id]);

    $this->actingAs($user)
        ->from(route('projects.show', $project))
        ->delete(route('projects.destroy', $project))
        ->assertRedirect(route('projects.show', $project));

    $this->assertNotSoftDeleted($project);
});

test('guests cannot delete projects', function () {
    $project = Project::factory()->create();

    $this->delete(route('projects.destroy', $project))
        ->assertRedirect(route('login'));

    $this->assertNotSoftDeleted($project);
});
