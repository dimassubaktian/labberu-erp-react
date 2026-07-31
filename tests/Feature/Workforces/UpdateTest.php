<?php

use App\Models\JobTitle;
use App\Models\User;
use App\Models\Workforce;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Inertia\Testing\AssertableInertia as Assert;

test('workforce edit page is displayed', function () {
    $user = User::factory()->create();
    $jobTitle = JobTitle::factory()->create(['status' => 'active']);
    $workforce = Workforce::factory()->create([
        'full_name' => 'Jane Doe',
        'job_title_id' => $jobTitle->id,
    ]);

    $this->actingAs($user)
        ->get(route('workforces.edit', $workforce))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('workforces/edit')
            ->where('workforce.uuid', $workforce->uuid)
            ->where('workforce.full_name', 'Jane Doe'),
        );
});

test('workforce edit page includes the current job title even when inactive', function () {
    $user = User::factory()->create();
    $inactiveJobTitle = JobTitle::factory()->create(['status' => 'inactive']);
    $workforce = Workforce::factory()->create(['job_title_id' => $inactiveJobTitle->id]);

    $this->actingAs($user)
        ->get(route('workforces.edit', $workforce))
        ->assertInertia(fn (Assert $page) => $page
            ->where('jobTitles.0.id', $inactiveJobTitle->id),
        );
});

test('workforce can be updated', function () {
    $user = User::factory()->create();
    $jobTitle = JobTitle::factory()->create();
    $workforce = Workforce::factory()->create(['full_name' => 'Jane Doe']);

    $response = $this->actingAs($user)
        ->put(route('workforces.update', $workforce), [
            'full_name' => 'Jane Smith',
            'email' => $workforce->email,
            'job_title_id' => $jobTitle->id,
            'gender' => $workforce->gender,
            'status' => 'inactive',
        ]);

    $response
        ->assertSessionHasNoErrors()
        ->assertRedirect(route('workforces.show', $workforce));

    $this->assertDatabaseHas('workforces', [
        'id' => $workforce->id,
        'full_name' => 'Jane Smith',
        'job_title_id' => $jobTitle->id,
        'status' => 'inactive',
    ]);
});

test('uploading a new photo replaces the old one', function () {
    Storage::fake('local');

    $user = User::factory()->create();
    $jobTitle = JobTitle::factory()->create();
    $workforce = Workforce::factory()->create([
        'job_title_id' => $jobTitle->id,
        'photo' => 'workforce-photos/old.jpg',
    ]);
    Storage::disk('local')->put($workforce->photo, 'old-contents');

    $this->actingAs($user)->put(route('workforces.update', $workforce), [
        'full_name' => $workforce->full_name,
        'email' => $workforce->email,
        'job_title_id' => $jobTitle->id,
        'gender' => $workforce->gender,
        'status' => $workforce->status,
        'photo' => UploadedFile::fake()->image('new.jpg'),
    ]);

    $workforce->refresh();

    expect($workforce->photo)->not->toBe('workforce-photos/old.jpg');
    Storage::disk('local')->assertMissing('workforce-photos/old.jpg');
    Storage::disk('local')->assertExists($workforce->photo);
});

test('email must be unique except for itself', function () {
    $user = User::factory()->create();
    $jobTitle = JobTitle::factory()->create();
    $workforce = Workforce::factory()->create(['email' => 'jane.doe@example.com']);

    $this->actingAs($user)
        ->put(route('workforces.update', $workforce), [
            'full_name' => $workforce->full_name,
            'email' => 'jane.doe@example.com',
            'job_title_id' => $jobTitle->id,
            'gender' => $workforce->gender,
            'status' => $workforce->status,
        ])
        ->assertSessionHasNoErrors();
});

test('email must be unique against other workforces', function () {
    $user = User::factory()->create();
    $jobTitle = JobTitle::factory()->create();
    Workforce::factory()->create(['email' => 'taken@example.com']);
    $workforce = Workforce::factory()->create();

    $this->actingAs($user)
        ->put(route('workforces.update', $workforce), [
            'full_name' => $workforce->full_name,
            'email' => 'taken@example.com',
            'job_title_id' => $jobTitle->id,
            'gender' => $workforce->gender,
            'status' => $workforce->status,
        ])
        ->assertSessionHasErrors('email');
});

test('guests cannot edit or update workforces', function () {
    $workforce = Workforce::factory()->create();

    $this->get(route('workforces.edit', $workforce))
        ->assertRedirect(route('login'));

    $this->put(route('workforces.update', $workforce), [])
        ->assertRedirect(route('login'));
});
