<?php

use App\Models\Equipment;
use App\Models\User;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;

test('a calibration can be recorded and updates the equipment due date', function () {
    $user = User::factory()->create();
    $equipment = Equipment::factory()->create(['next_calibration_due_date' => null]);

    $response = $this->actingAs($user)->post(route('equipment.calibrations.store', $equipment), [
        'certificate_number' => 'CAL-001',
        'calibration_date' => '2026-01-01',
        'due_date' => '2027-01-01',
        'result' => 'passed',
    ]);

    $response
        ->assertSessionHasNoErrors()
        ->assertRedirect(route('equipment.show', $equipment));

    $calibration = $equipment->calibrations()->sole();
    expect($calibration->certificate_number)->toBe('CAL-001');
    expect($calibration->created_by)->toBe($user->id);
    expect($equipment->refresh()->next_calibration_due_date->toDateString())->toBe('2027-01-01');
});

test('due date cannot be before the calibration date', function () {
    $user = User::factory()->create();
    $equipment = Equipment::factory()->create();

    $this->actingAs($user)
        ->post(route('equipment.calibrations.store', $equipment), [
            'calibration_date' => '2027-01-01',
            'due_date' => '2026-01-01',
            'result' => 'passed',
        ])
        ->assertSessionHasErrors('due_date');
});

test('the equipment due date tracks the latest calibration record', function () {
    $user = User::factory()->create();
    $equipment = Equipment::factory()->create();

    $equipment->calibrations()->create([
        'calibration_date' => '2025-01-01',
        'due_date' => '2026-01-01',
        'result' => 'passed',
        'created_by' => $user->id,
    ]);
    $recent = $equipment->calibrations()->create([
        'calibration_date' => '2026-01-01',
        'due_date' => '2027-06-01',
        'result' => 'passed',
        'created_by' => $user->id,
    ]);
    $equipment->recomputeCalibration();

    expect($equipment->refresh()->next_calibration_due_date->toDateString())->toBe('2027-06-01');

    $this->actingAs($user)->delete(route('equipment.calibrations.destroy', [$equipment, $recent]));

    expect($equipment->refresh()->next_calibration_due_date->toDateString())->toBe('2026-01-01');
});

test('a calibration record can be updated and recomputes the equipment due date', function () {
    $user = User::factory()->create();
    $equipment = Equipment::factory()->create();
    $calibration = $equipment->calibrations()->create([
        'calibration_date' => '2026-01-01',
        'due_date' => '2027-01-01',
        'result' => 'passed',
        'created_by' => $user->id,
    ]);
    $equipment->recomputeCalibration();

    $response = $this->actingAs($user)->put(route('equipment.calibrations.update', [$equipment, $calibration]), [
        'certificate_number' => 'CAL-002',
        'calibration_date' => '2026-01-01',
        'due_date' => '2027-06-01',
        'result' => 'conditional',
    ]);

    $response
        ->assertSessionHasNoErrors()
        ->assertRedirect(route('equipment.show', $equipment));

    $calibration->refresh();
    expect($calibration->certificate_number)->toBe('CAL-002');
    expect($calibration->result)->toBe('conditional');
    expect($calibration->due_date->toDateString())->toBe('2027-06-01');
    expect($equipment->refresh()->next_calibration_due_date->toDateString())->toBe('2027-06-01');
});

test('replacing a calibration certificate file deletes the old one', function () {
    Storage::fake('local');

    $user = User::factory()->create();
    $equipment = Equipment::factory()->create();
    $oldPath = UploadedFile::fake()->create('old.pdf', 50)->store('equipment-certificates', 'local');
    $calibration = $equipment->calibrations()->create([
        'calibration_date' => '2026-01-01',
        'due_date' => '2027-01-01',
        'result' => 'passed',
        'certificate_file' => $oldPath,
        'created_by' => $user->id,
    ]);

    $this->actingAs($user)->put(route('equipment.calibrations.update', [$equipment, $calibration]), [
        'calibration_date' => '2026-01-01',
        'due_date' => '2027-01-01',
        'result' => 'passed',
        'certificate_file' => UploadedFile::fake()->create('new.pdf', 50),
    ]);

    Storage::disk('local')->assertMissing($oldPath);
    Storage::disk('local')->assertExists($calibration->refresh()->certificate_file);
});

test('a calibration record cannot be updated through a different equipment', function () {
    $user = User::factory()->create();
    $equipment = Equipment::factory()->create();
    $otherEquipment = Equipment::factory()->create();
    $calibration = $equipment->calibrations()->create([
        'calibration_date' => '2026-01-01',
        'due_date' => '2027-01-01',
        'result' => 'passed',
        'created_by' => $user->id,
    ]);

    $this->actingAs($user)
        ->put(route('equipment.calibrations.update', [$otherEquipment, $calibration]), [
            'calibration_date' => '2026-01-01',
            'due_date' => '2027-01-01',
            'result' => 'passed',
        ])
        ->assertNotFound();
});

test('a calibration certificate can be downloaded and only through its own equipment', function () {
    Storage::fake('local');

    $user = User::factory()->create();
    $equipment = Equipment::factory()->create();
    $otherEquipment = Equipment::factory()->create();
    $path = UploadedFile::fake()->create('certificate.pdf', 50)->store('equipment-certificates', 'local');
    $calibration = $equipment->calibrations()->create([
        'calibration_date' => '2026-01-01',
        'due_date' => '2027-01-01',
        'result' => 'passed',
        'certificate_file' => $path,
        'created_by' => $user->id,
    ]);

    $this->actingAs($user)
        ->get(route('equipment.calibrations.download', [$equipment, $calibration]))
        ->assertOk();

    $this->actingAs($user)
        ->get(route('equipment.calibrations.download', [$otherEquipment, $calibration]))
        ->assertNotFound();
});

test('guests cannot record, update, or delete calibrations', function () {
    $equipment = Equipment::factory()->create();
    $calibration = $equipment->calibrations()->create([
        'calibration_date' => '2026-01-01',
        'due_date' => '2027-01-01',
        'result' => 'passed',
        'created_by' => User::factory()->create()->id,
    ]);

    $this->post(route('equipment.calibrations.store', $equipment), [])
        ->assertRedirect(route('login'));

    $this->put(route('equipment.calibrations.update', [$equipment, $calibration]), [])
        ->assertRedirect(route('login'));

    $this->delete(route('equipment.calibrations.destroy', [$equipment, $calibration]))
        ->assertRedirect(route('login'));
});
