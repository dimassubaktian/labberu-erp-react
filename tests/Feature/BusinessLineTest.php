<?php

use App\Models\BusinessLine;
use App\Models\Project;
use App\Models\User;
use Inertia\Testing\AssertableInertia as Assert;

test('business line is created with an auto-generated uuid and default status', function () {
    $businessLine = BusinessLine::factory()->create(['name' => 'Lab Testing']);

    expect($businessLine->uuid)->not->toBeNull();
    expect($businessLine->name)->toBe('Lab Testing');
    expect($businessLine->status)->toBe('active');
});

test('business line can be soft deleted', function () {
    $businessLine = BusinessLine::factory()->create();

    $businessLine->delete();

    expect($businessLine->deleted_at)->not->toBeNull();
    $this->assertSoftDeleted($businessLine);
    expect(BusinessLine::find($businessLine->id))->toBeNull();
    expect(BusinessLine::withTrashed()->find($businessLine->id))->not->toBeNull();
});

test('business lines index page is displayed', function () {
    $user = User::factory()->create();
    BusinessLine::factory()->create(['name' => 'Lab Testing']);
    BusinessLine::factory()->create(['name' => 'Consulting']);

    $this->actingAs($user)
        ->get(route('business-lines.index'))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('business-lines/index')
            ->has('businessLines.data', 2),
        );
});

test('trashed business lines are not listed', function () {
    $user = User::factory()->create();
    BusinessLine::factory()->create();
    BusinessLine::factory()->create()->delete();

    $this->actingAs($user)
        ->get(route('business-lines.index'))
        ->assertInertia(fn (Assert $page) => $page
            ->has('businessLines.data', 1),
        );
});

test('guests cannot view business lines', function () {
    $this->get(route('business-lines.index'))
        ->assertRedirect(route('login'));
});

test('creating a business line redirects to the index page', function () {
    $user = User::factory()->create();

    $response = $this->actingAs($user)
        ->post(route('business-lines.store'), [
            'name' => 'Lab Testing',
            'status' => 'active',
        ]);

    $response->assertSessionHasNoErrors();
    $response->assertRedirect(route('business-lines.index'));
    $this->assertDatabaseHas('business_lines', ['name' => 'Lab Testing']);
});

test('creating a business line with create_another redirects back to the create page', function () {
    $user = User::factory()->create();

    $response = $this->actingAs($user)
        ->post(route('business-lines.store'), [
            'name' => 'Lab Testing',
            'status' => 'active',
            'create_another' => true,
        ]);

    $response->assertSessionHasNoErrors();
    $response->assertRedirect(route('business-lines.create'));
    $this->assertDatabaseHas('business_lines', ['name' => 'Lab Testing']);
});

test('project can be assigned a business line', function () {
    $businessLine = BusinessLine::factory()->create();
    $project = Project::factory()->create(['business_line_id' => $businessLine->id]);

    expect($project->businessLine->id)->toBe($businessLine->id);
    expect($businessLine->projects->first()->id)->toBe($project->id);
});
