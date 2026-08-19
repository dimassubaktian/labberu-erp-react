<?php

use App\Models\Equipment;
use App\Models\User;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;

test('equipment can be updated', function () {
    $user = User::factory()->create();
    $equipment = Equipment::factory()->create(['name' => 'Old Name']);

    $response = $this->actingAs($user)->put(route('equipment.update', $equipment), [
        'name' => 'New Name',
        'category' => 'Multimeter',
        'calibration_required' => '0',
        'status' => 'under_maintenance',
    ]);

    $response
        ->assertSessionHasNoErrors()
        ->assertRedirect(route('equipment.show', $equipment));

    expect($equipment->refresh()->name)->toBe('New Name');
    expect($equipment->status)->toBe('under_maintenance');
});

test('replacing the picture deletes the old file', function () {
    Storage::fake('local');

    $user = User::factory()->create();
    $oldPath = UploadedFile::fake()->image('old.jpg')->store('equipment-pictures', 'local');
    $equipment = Equipment::factory()->create(['picture' => $oldPath]);

    $this->actingAs($user)->put(route('equipment.update', $equipment), [
        'name' => $equipment->name,
        'category' => 'Multimeter',
        'calibration_required' => '0',
        'status' => 'available',
        'picture' => UploadedFile::fake()->image('new.jpg'),
    ]);

    Storage::disk('local')->assertMissing($oldPath);
    Storage::disk('local')->assertExists($equipment->refresh()->picture);
});

test('serial number uniqueness ignores the equipment being updated', function () {
    $user = User::factory()->create();
    $equipment = Equipment::factory()->create(['serial_number' => 'SN-99999']);

    $this->actingAs($user)
        ->put(route('equipment.update', $equipment), [
            'name' => $equipment->name,
            'category' => 'Multimeter',
            'serial_number' => 'SN-99999',
            'calibration_required' => '0',
            'status' => 'available',
        ])
        ->assertSessionHasNoErrors();
});
