<?php

use App\Models\Project;
use App\Models\Quotation;
use App\Models\User;

test('a projects quotations are listed for dependent pickers', function () {
    $user = User::factory()->create();
    $project = Project::factory()->create();
    Quotation::factory()->create(['project_id' => $project->id]);
    Quotation::factory()->create();

    $this->actingAs($user)
        ->getJson(route('projects.quotations.index', $project))
        ->assertOk()
        ->assertJsonCount(1, 'data');
});

test('guests cannot list a projects quotations', function () {
    $project = Project::factory()->create();

    $this->getJson(route('projects.quotations.index', $project))
        ->assertUnauthorized();
});
