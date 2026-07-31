<?php

use App\Models\JobTitle;
use App\Models\User;
use App\Models\Workforce;
use Inertia\Testing\AssertableInertia as Assert;

test('workforce detail page is displayed', function () {
    $user = User::factory()->create();
    $jobTitle = JobTitle::factory()->create(['name' => 'Software Engineer']);
    $workforce = Workforce::factory()->create([
        'full_name' => 'Jane Doe',
        'job_title_id' => $jobTitle->id,
    ]);

    $this->actingAs($user)
        ->get(route('workforces.show', $workforce))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('workforces/show')
            ->where('workforce.uuid', $workforce->uuid)
            ->where('workforce.full_name', 'Jane Doe')
            ->where('workforce.job_title.name', 'Software Engineer'),
        );
});

test('workforce detail page is resolved by uuid, not the numeric id', function () {
    $user = User::factory()->create();
    $workforce = Workforce::factory()->create();

    $this->actingAs($user)
        ->get(route('workforces.show', $workforce))
        ->assertOk();

    expect(route('workforces.show', $workforce))->toContain($workforce->uuid);
});

test('trashed workforces are not found', function () {
    $user = User::factory()->create();
    $workforce = Workforce::factory()->create();
    $workforce->delete();

    $this->actingAs($user)
        ->get(route('workforces.show', $workforce))
        ->assertNotFound();
});

test('guests cannot view a workforce', function () {
    $workforce = Workforce::factory()->create();

    $this->get(route('workforces.show', $workforce))
        ->assertRedirect(route('login'));
});
