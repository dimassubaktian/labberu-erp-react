<?php

use App\Models\Equipment;
use App\Models\User;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;

test('equipment can be created with a sequential code', function () {
    $user = User::factory()->create();

    $response = $this->actingAs($user)->post(route('equipment.store'), [
        'name' => 'Digital Multimeter',
        'category' => 'Multimeter',
        'calibration_required' => '1',
        'calibration_interval_months' => 12,
        'status' => 'available',
    ]);

    $response->assertSessionHasNoErrors();

    $equipment = Equipment::firstWhere('name', 'Digital Multimeter');
    expect($equipment->equipment_code)->toBe('LAB-EQP-001');

    $response->assertRedirect(route('equipment.show', $equipment));

    $second = Equipment::factory()->create();
    expect($second->equipment_code)->toBe('LAB-EQP-002');
});

test('required fields are validated', function () {
    $user = User::factory()->create();

    $this->actingAs($user)
        ->post(route('equipment.store'), [])
        ->assertSessionHasErrors(['name', 'category', 'calibration_required', 'status']);
});

test('calibration interval is required when calibration is required', function () {
    $user = User::factory()->create();

    $this->actingAs($user)
        ->post(route('equipment.store'), [
            'name' => 'Torque Wrench',
            'category' => 'Torque Wrench',
            'calibration_required' => '1',
            'status' => 'available',
        ])
        ->assertSessionHasErrors('calibration_interval_months');
});

test('serial number must be unique', function () {
    $user = User::factory()->create();
    Equipment::factory()->create(['serial_number' => 'SN-12345']);

    $this->actingAs($user)
        ->post(route('equipment.store'), [
            'name' => 'Duplicate Tool',
            'category' => 'Other',
            'serial_number' => 'SN-12345',
            'calibration_required' => '0',
            'status' => 'available',
        ])
        ->assertSessionHasErrors('serial_number');
});

test('equipment picture is stored privately and only served to authenticated users', function () {
    Storage::fake('local');

    $user = User::factory()->create();

    $this->actingAs($user)->post(route('equipment.store'), [
        'name' => 'Digital Multimeter',
        'category' => 'Multimeter',
        'calibration_required' => '0',
        'status' => 'available',
        'picture' => UploadedFile::fake()->image('multimeter.jpg'),
    ]);

    $equipment = Equipment::firstWhere('name', 'Digital Multimeter');

    expect($equipment->picture)->not->toBeNull();
    Storage::disk('local')->assertExists($equipment->picture);

    $this->actingAs($user)
        ->get(route('equipment.picture', $equipment))
        ->assertOk();
});

test('guests cannot view equipment picture', function () {
    Storage::fake('local');

    $equipment = Equipment::factory()->create(['picture' => 'equipment-pictures/tool.jpg']);
    Storage::disk('local')->put($equipment->picture, 'fake-image-contents');

    $this->get(route('equipment.picture', $equipment))
        ->assertRedirect(route('login'));
});

test('guests cannot create equipment', function () {
    $this->get(route('equipment.create'))
        ->assertRedirect(route('login'));

    $this->post(route('equipment.store'), [])
        ->assertRedirect(route('login'));
});
