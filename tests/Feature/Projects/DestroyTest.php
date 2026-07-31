<?php

use App\Models\Project;
use App\Models\User;

test('project can be deleted', function () {
    $user = User::factory()->create();
    $project = Project::factory()->create();

    $response = $this->actingAs($user)
        ->delete(route('projects.destroy', $project));

    $response->assertRedirect(route('projects.index'));

    $this->assertSoftDeleted($project);
});

test('guests cannot delete projects', function () {
    $project = Project::factory()->create();

    $this->delete(route('projects.destroy', $project))
        ->assertRedirect(route('login'));

    $this->assertNotSoftDeleted($project);
});
