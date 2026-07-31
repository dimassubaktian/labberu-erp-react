<?php

use App\Models\JobTitle;
use App\Models\User;
use App\Models\Workforce;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Inertia\Testing\AssertableInertia as Assert;

test('workforce create page is displayed with active job title options', function () {
    $user = User::factory()->create();
    $activeJobTitle = JobTitle::factory()->create(['status' => 'active']);
    JobTitle::factory()->create(['status' => 'inactive']);

    $this->actingAs($user)
        ->get(route('workforces.create'))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('workforces/create')
            ->has('jobTitles', 1)
            ->where('jobTitles.0.id', $activeJobTitle->id),
        );
});

test('workforce can be created', function () {
    $user = User::factory()->create();
    $jobTitle = JobTitle::factory()->create();

    $response = $this->actingAs($user)
        ->post(route('workforces.store'), [
            'full_name' => 'Jane Doe',
            'email' => 'jane.doe@example.com',
            'phone' => '555-0100',
            'address' => '123 Main St',
            'job_title_id' => $jobTitle->id,
            'gender' => 'female',
            'status' => 'active',
        ]);

    $response
        ->assertSessionHasNoErrors()
        ->assertRedirect(route('workforces.index'));

    $this->assertDatabaseHas('workforces', [
        'full_name' => 'Jane Doe',
        'email' => 'jane.doe@example.com',
        'job_title_id' => $jobTitle->id,
        'employee_code' => 'LAB-EMP-001',
    ]);
});

test('workforce photo is stored privately and only served to authenticated users', function () {
    Storage::fake('local');

    $user = User::factory()->create();
    $jobTitle = JobTitle::factory()->create();

    $this->actingAs($user)->post(route('workforces.store'), [
        'full_name' => 'Jane Doe',
        'email' => 'jane.doe@example.com',
        'job_title_id' => $jobTitle->id,
        'gender' => 'female',
        'status' => 'active',
        'photo' => UploadedFile::fake()->image('avatar.jpg'),
    ]);

    $workforce = Workforce::firstWhere('email', 'jane.doe@example.com');

    expect($workforce->photo)->not->toBeNull();
    Storage::disk('local')->assertExists($workforce->photo);

    $this->actingAs($user)
        ->get(route('workforces.photo', $workforce))
        ->assertOk();
});

test('guests cannot view a workforce photo', function () {
    Storage::fake('local');

    $workforce = Workforce::factory()->create(['photo' => 'workforce-photos/avatar.jpg']);
    Storage::disk('local')->put($workforce->photo, 'fake-image-contents');

    $this->get(route('workforces.photo', $workforce))
        ->assertRedirect(route('login'));
});

test('required fields are validated', function () {
    $user = User::factory()->create();

    $this->actingAs($user)
        ->post(route('workforces.store'), [])
        ->assertSessionHasErrors([
            'full_name',
            'email',
            'job_title_id',
            'gender',
            'status',
        ]);
});

test('email must be unique', function () {
    $user = User::factory()->create();
    $jobTitle = JobTitle::factory()->create();
    Workforce::factory()->create(['email' => 'jane.doe@example.com']);

    $this->actingAs($user)
        ->post(route('workforces.store'), [
            'full_name' => 'Jane Doe',
            'email' => 'jane.doe@example.com',
            'job_title_id' => $jobTitle->id,
            'gender' => 'female',
            'status' => 'active',
        ])
        ->assertSessionHasErrors('email');
});

test('email of a soft-deleted workforce can be reused', function () {
    $user = User::factory()->create();
    $jobTitle = JobTitle::factory()->create();
    $trashed = Workforce::factory()->create(['email' => 'jane.doe@example.com']);
    $trashed->delete();

    $response = $this->actingAs($user)
        ->post(route('workforces.store'), [
            'full_name' => 'Jane Doe',
            'email' => 'jane.doe@example.com',
            'job_title_id' => $jobTitle->id,
            'gender' => 'female',
            'status' => 'active',
        ]);

    $response
        ->assertSessionHasNoErrors()
        ->assertRedirect(route('workforces.index'));

    $this->assertDatabaseHas('workforces', [
        'email' => 'jane.doe@example.com',
        'full_name' => 'Jane Doe',
        'deleted_at' => null,
    ]);
});

test('job title must exist and not be soft-deleted', function () {
    $user = User::factory()->create();
    $trashedJobTitle = JobTitle::factory()->create();
    $trashedJobTitle->delete();

    $this->actingAs($user)
        ->post(route('workforces.store'), [
            'full_name' => 'Jane Doe',
            'email' => 'jane.doe@example.com',
            'job_title_id' => $trashedJobTitle->id,
            'gender' => 'female',
            'status' => 'active',
        ])
        ->assertSessionHasErrors('job_title_id');
});

test('gender must be male or female', function () {
    $user = User::factory()->create();
    $jobTitle = JobTitle::factory()->create();

    $this->actingAs($user)
        ->post(route('workforces.store'), [
            'full_name' => 'Jane Doe',
            'email' => 'jane.doe@example.com',
            'job_title_id' => $jobTitle->id,
            'gender' => 'other',
            'status' => 'active',
        ])
        ->assertSessionHasErrors('gender');
});

test('guests cannot create workforces', function () {
    $this->get(route('workforces.create'))
        ->assertRedirect(route('login'));

    $this->post(route('workforces.store'), [])
        ->assertRedirect(route('login'));
});
