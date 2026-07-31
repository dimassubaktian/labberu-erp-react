<?php

use App\Models\JobTitle;
use App\Models\User;
use App\Models\Workforce;
use Inertia\Testing\AssertableInertia as Assert;

test('job title detail page is displayed', function () {
    $user = User::factory()->create();
    $jobTitle = JobTitle::factory()->create(['name' => 'Software Engineer']);

    $this->actingAs($user)
        ->get(route('job-titles.show', $jobTitle))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('job-titles/show')
            ->where('jobTitle.uuid', $jobTitle->uuid)
            ->where('jobTitle.name', 'Software Engineer')
            ->has('workforces', 0),
        );
});

test('job title detail page lists its assigned workforce', function () {
    $user = User::factory()->create();
    $jobTitle = JobTitle::factory()->create();
    $workforce = Workforce::factory()->create(['job_title_id' => $jobTitle->id]);
    Workforce::factory()->create();

    $this->actingAs($user)
        ->get(route('job-titles.show', $jobTitle))
        ->assertInertia(fn (Assert $page) => $page
            ->has('workforces', 1)
            ->where('workforces.0.uuid', $workforce->uuid)
            ->where('workforces.0.full_name', $workforce->full_name),
        );
});

test('job title detail page is resolved by uuid, not the numeric id', function () {
    $user = User::factory()->create();
    $jobTitle = JobTitle::factory()->create();

    $this->actingAs($user)
        ->get(route('job-titles.show', $jobTitle))
        ->assertOk();

    expect(route('job-titles.show', $jobTitle))->toContain($jobTitle->uuid);
});

test('trashed job titles are not found', function () {
    $user = User::factory()->create();
    $jobTitle = JobTitle::factory()->create();
    $jobTitle->delete();

    $this->actingAs($user)
        ->get(route('job-titles.show', $jobTitle))
        ->assertNotFound();
});

test('guests cannot view a job title', function () {
    $jobTitle = JobTitle::factory()->create();

    $this->get(route('job-titles.show', $jobTitle))
        ->assertRedirect(route('login'));
});
