<?php

use App\Models\JobTitle;
use App\Models\User;
use Inertia\Testing\AssertableInertia as Assert;

test('job titles index page is displayed', function () {
    $user = User::factory()->create();
    JobTitle::factory()->create(['name' => 'Software Engineer']);
    JobTitle::factory()->create(['name' => 'Product Manager']);

    $this->actingAs($user)
        ->get(route('job-titles.index'))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('job-titles/index')
            ->has('jobTitles.data', 2),
        );
});

test('trashed job titles are not listed', function () {
    $user = User::factory()->create();
    JobTitle::factory()->create();
    JobTitle::factory()->create()->delete();

    $this->actingAs($user)
        ->get(route('job-titles.index'))
        ->assertInertia(fn (Assert $page) => $page
            ->has('jobTitles.data', 1),
        );
});

test('guests cannot view job titles', function () {
    $this->get(route('job-titles.index'))
        ->assertRedirect(route('login'));
});
