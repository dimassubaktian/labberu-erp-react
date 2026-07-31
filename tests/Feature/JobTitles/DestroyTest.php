<?php

use App\Models\JobTitle;
use App\Models\User;
use App\Models\Workforce;

test('job title can be deleted', function () {
    $user = User::factory()->create();
    $jobTitle = JobTitle::factory()->create();

    $response = $this->actingAs($user)
        ->delete(route('job-titles.destroy', $jobTitle));

    $response->assertRedirect(route('job-titles.index'));

    $this->assertSoftDeleted($jobTitle);
});

test('job title assigned to workforce members cannot be deleted', function () {
    $user = User::factory()->create();
    $jobTitle = JobTitle::factory()->create();
    Workforce::factory()->create(['job_title_id' => $jobTitle->id]);

    $response = $this->actingAs($user)
        ->from(route('job-titles.show', $jobTitle))
        ->delete(route('job-titles.destroy', $jobTitle));

    $response->assertRedirect(route('job-titles.show', $jobTitle));

    $this->assertNotSoftDeleted($jobTitle);
});

test('guests cannot delete job titles', function () {
    $jobTitle = JobTitle::factory()->create();

    $this->delete(route('job-titles.destroy', $jobTitle))
        ->assertRedirect(route('login'));

    $this->assertNotSoftDeleted($jobTitle);
});
