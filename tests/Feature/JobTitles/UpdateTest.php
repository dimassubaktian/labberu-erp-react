<?php

use App\Models\JobTitle;
use App\Models\User;
use Inertia\Testing\AssertableInertia as Assert;

test('job title edit page is displayed', function () {
    $user = User::factory()->create();
    $jobTitle = JobTitle::factory()->create(['name' => 'Software Engineer']);

    $this->actingAs($user)
        ->get(route('job-titles.edit', $jobTitle))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('job-titles/edit')
            ->where('jobTitle.uuid', $jobTitle->uuid)
            ->where('jobTitle.name', 'Software Engineer'),
        );
});

test('job title can be updated', function () {
    $user = User::factory()->create();
    $jobTitle = JobTitle::factory()->create([
        'name' => 'Software Engineer',
        'status' => 'active',
    ]);

    $response = $this->actingAs($user)
        ->put(route('job-titles.update', $jobTitle), [
            'name' => 'Senior Software Engineer',
            'status' => 'inactive',
        ]);

    $response
        ->assertSessionHasNoErrors()
        ->assertRedirect(route('job-titles.show', $jobTitle));

    $this->assertDatabaseHas('job_titles', [
        'id' => $jobTitle->id,
        'name' => 'Senior Software Engineer',
        'status' => 'inactive',
    ]);
});

test('name is required', function () {
    $user = User::factory()->create();
    $jobTitle = JobTitle::factory()->create();

    $this->actingAs($user)
        ->put(route('job-titles.update', $jobTitle), [
            'name' => '',
            'status' => 'active',
        ])
        ->assertSessionHasErrors('name');
});

test('status must be active or inactive', function () {
    $user = User::factory()->create();
    $jobTitle = JobTitle::factory()->create();

    $this->actingAs($user)
        ->put(route('job-titles.update', $jobTitle), [
            'name' => 'Software Engineer',
            'status' => 'archived',
        ])
        ->assertSessionHasErrors('status');
});

test('name must be unique except for itself', function () {
    $user = User::factory()->create();
    $jobTitle = JobTitle::factory()->create(['name' => 'Software Engineer']);

    $this->actingAs($user)
        ->put(route('job-titles.update', $jobTitle), [
            'name' => 'Software Engineer',
            'status' => 'active',
        ])
        ->assertSessionHasNoErrors();
});

test('name must be unique against other job titles', function () {
    $user = User::factory()->create();
    JobTitle::factory()->create(['name' => 'Product Manager']);
    $jobTitle = JobTitle::factory()->create(['name' => 'Software Engineer']);

    $this->actingAs($user)
        ->put(route('job-titles.update', $jobTitle), [
            'name' => 'Product Manager',
            'status' => 'active',
        ])
        ->assertSessionHasErrors('name');
});

test('name of a soft-deleted job title can be reused by another job title', function () {
    $user = User::factory()->create();
    $trashed = JobTitle::factory()->create(['name' => 'Product Manager']);
    $trashed->delete();
    $jobTitle = JobTitle::factory()->create(['name' => 'Software Engineer']);

    $this->actingAs($user)
        ->put(route('job-titles.update', $jobTitle), [
            'name' => 'Product Manager',
            'status' => 'active',
        ])
        ->assertSessionHasNoErrors();
});

test('guests cannot edit or update job titles', function () {
    $jobTitle = JobTitle::factory()->create();

    $this->get(route('job-titles.edit', $jobTitle))
        ->assertRedirect(route('login'));

    $this->put(route('job-titles.update', $jobTitle), [
        'name' => 'Software Engineer',
        'status' => 'active',
    ])->assertRedirect(route('login'));
});
