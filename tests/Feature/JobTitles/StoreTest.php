<?php

use App\Models\JobTitle;
use App\Models\User;
use Inertia\Testing\AssertableInertia as Assert;

test('job title create page is displayed', function () {
    $user = User::factory()->create();

    $this->actingAs($user)
        ->get(route('job-titles.create'))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('job-titles/create'),
        );
});

test('job title can be created', function () {
    $user = User::factory()->create();

    $response = $this->actingAs($user)
        ->post(route('job-titles.store'), [
            'name' => 'Software Engineer',
            'status' => 'active',
        ]);

    $response
        ->assertSessionHasNoErrors()
        ->assertRedirect(route('job-titles.index'));

    $this->assertDatabaseHas('job_titles', [
        'name' => 'Software Engineer',
        'status' => 'active',
    ]);
});

test('name is required', function () {
    $user = User::factory()->create();

    $this->actingAs($user)
        ->post(route('job-titles.store'), [
            'name' => '',
            'status' => 'active',
        ])
        ->assertSessionHasErrors('name');
});

test('status must be active or inactive', function () {
    $user = User::factory()->create();

    $this->actingAs($user)
        ->post(route('job-titles.store'), [
            'name' => 'Software Engineer',
            'status' => 'archived',
        ])
        ->assertSessionHasErrors('status');
});

test('name must be unique', function () {
    $user = User::factory()->create();
    JobTitle::factory()->create(['name' => 'Software Engineer']);

    $this->actingAs($user)
        ->post(route('job-titles.store'), [
            'name' => 'Software Engineer',
            'status' => 'active',
        ])
        ->assertSessionHasErrors('name');
});

test('name of a soft-deleted job title can be reused', function () {
    $user = User::factory()->create();
    $trashed = JobTitle::factory()->create(['name' => 'Software Engineer']);
    $trashed->delete();

    $response = $this->actingAs($user)
        ->post(route('job-titles.store'), [
            'name' => 'Software Engineer',
            'status' => 'active',
        ]);

    $response
        ->assertSessionHasNoErrors()
        ->assertRedirect(route('job-titles.index'));

    $this->assertDatabaseHas('job_titles', [
        'name' => 'Software Engineer',
        'status' => 'active',
        'deleted_at' => null,
    ]);
});

test('guests cannot create job titles', function () {
    $this->post(route('job-titles.store'), [
        'name' => 'Software Engineer',
        'status' => 'active',
    ])->assertRedirect(route('login'));
});
