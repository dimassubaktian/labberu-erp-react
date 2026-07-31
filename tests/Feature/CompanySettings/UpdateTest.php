<?php

use App\Models\CompanySetting;
use App\Models\User;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Inertia\Testing\AssertableInertia as Assert;

test('company settings page is displayed', function () {
    $user = User::factory()->create();
    CompanySetting::factory()->create(['legal_name' => 'PT Labberu Teknologi']);

    $this->actingAs($user)
        ->get(route('company-settings.edit'))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('company-settings/edit')
            ->where('companySetting.legal_name', 'PT Labberu Teknologi'),
        );
});

test('company settings page is displayed before any record exists', function () {
    $user = User::factory()->create();

    $this->actingAs($user)
        ->get(route('company-settings.edit'))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('company-settings/edit')
            ->where('companySetting.legal_name', null),
        );
});

test('company settings are created when none exist yet', function () {
    $user = User::factory()->create();

    $response = $this->actingAs($user)
        ->put(route('company-settings.update'), [
            'legal_name' => 'PT Labberu Teknologi Indonesia',
            'email' => 'hello@labberu.test',
        ]);

    $response
        ->assertSessionHasNoErrors()
        ->assertRedirect(route('company-settings.edit'));

    $this->assertDatabaseHas('company_settings', [
        'legal_name' => 'PT Labberu Teknologi Indonesia',
        'email' => 'hello@labberu.test',
    ]);
    expect(CompanySetting::count())->toBe(1);
});

test('company settings can be updated', function () {
    $user = User::factory()->create();
    $companySetting = CompanySetting::factory()->create([
        'legal_name' => 'PT Labberu Teknologi',
    ]);

    $response = $this->actingAs($user)
        ->put(route('company-settings.update'), [
            'legal_name' => 'PT Labberu Teknologi Indonesia',
        ]);

    $response
        ->assertSessionHasNoErrors()
        ->assertRedirect(route('company-settings.edit'));

    $this->assertDatabaseHas('company_settings', [
        'id' => $companySetting->id,
        'legal_name' => 'PT Labberu Teknologi Indonesia',
    ]);
    expect(CompanySetting::count())->toBe(1);
});

test('logo can be uploaded and replaces the previous file', function () {
    Storage::fake('public');
    $user = User::factory()->create();
    $companySetting = CompanySetting::factory()->create([
        'logo' => 'company-logos/old.png',
    ]);
    Storage::disk('public')->put('company-logos/old.png', 'fake-content');

    $response = $this->actingAs($user)
        ->put(route('company-settings.update'), [
            'legal_name' => $companySetting->legal_name,
            'logo' => UploadedFile::fake()->image('logo.png'),
        ]);

    $response->assertSessionHasNoErrors();

    Storage::disk('public')->assertMissing('company-logos/old.png');
    $companySetting->refresh();
    expect($companySetting->logo)->not->toBe('company-logos/old.png');
    Storage::disk('public')->assertExists($companySetting->logo);
});

test('required fields are validated', function () {
    $user = User::factory()->create();

    $this->actingAs($user)
        ->put(route('company-settings.update'), [])
        ->assertSessionHasErrors(['legal_name']);
});

test('email must be a valid email', function () {
    $user = User::factory()->create();

    $this->actingAs($user)
        ->put(route('company-settings.update'), [
            'legal_name' => 'PT Labberu Teknologi',
            'email' => 'not-an-email',
        ])
        ->assertSessionHasErrors('email');
});

test('guests cannot view or update company settings', function () {
    $this->get(route('company-settings.edit'))
        ->assertRedirect(route('login'));

    $this->put(route('company-settings.update'), [])
        ->assertRedirect(route('login'));
});
