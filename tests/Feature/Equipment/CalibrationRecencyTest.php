<?php

use App\Models\Equipment;
use App\Models\Project;
use App\Models\User;
use Inertia\Testing\AssertableInertia as Assert;

test('checkout is blocked when the project requires more recent calibration than the equipment has', function () {
    $user = User::factory()->create();
    $project = Project::factory()->create(['equipment_calibration_max_age_months' => 6]);
    $equipment = Equipment::factory()->create(['status' => 'available', 'calibration_required' => true]);
    $equipment->calibrations()->create([
        'calibration_date' => now()->subMonths(8),
        'due_date' => now()->addMonths(4),
        'result' => 'passed',
        'created_by' => $user->id,
    ]);

    $this->actingAs($user)
        ->post(route('projects.equipment-checkouts.store', $project), [
            'equipment_id' => $equipment->id,
            'checked_out_at' => now()->toDateTimeString(),
        ])
        ->assertSessionHasErrors('equipment_id');

    expect($equipment->refresh()->current_project_id)->toBeNull();
});

test('checkout succeeds when the equipment was calibrated within the required window', function () {
    $user = User::factory()->create();
    $project = Project::factory()->create(['equipment_calibration_max_age_months' => 6]);
    $equipment = Equipment::factory()->create(['status' => 'available', 'calibration_required' => true]);
    $equipment->calibrations()->create([
        'calibration_date' => now()->subMonths(2),
        'due_date' => now()->addMonths(10),
        'result' => 'passed',
        'created_by' => $user->id,
    ]);

    $this->actingAs($user)
        ->post(route('projects.equipment-checkouts.store', $project), [
            'equipment_id' => $equipment->id,
            'checked_out_at' => now()->toDateTimeString(),
        ])
        ->assertSessionHasNoErrors();

    expect($equipment->refresh()->current_project_id)->toBe($project->id);
});

test('checkout is blocked when equipment requiring calibration has never been calibrated', function () {
    $user = User::factory()->create();
    $project = Project::factory()->create(['equipment_calibration_max_age_months' => 6]);
    $equipment = Equipment::factory()->create(['status' => 'available', 'calibration_required' => true]);

    $this->actingAs($user)
        ->post(route('projects.equipment-checkouts.store', $project), [
            'equipment_id' => $equipment->id,
            'checked_out_at' => now()->toDateTimeString(),
        ])
        ->assertSessionHasErrors('equipment_id');
});

test('equipment that does not require calibration is exempt from the project requirement', function () {
    $user = User::factory()->create();
    $project = Project::factory()->create(['equipment_calibration_max_age_months' => 6]);
    $equipment = Equipment::factory()->notCalibrated()->create(['status' => 'available']);

    $this->actingAs($user)
        ->post(route('projects.equipment-checkouts.store', $project), [
            'equipment_id' => $equipment->id,
            'checked_out_at' => now()->toDateTimeString(),
        ])
        ->assertSessionHasNoErrors();
});

test('checkout is not restricted when the project has no calibration recency requirement', function () {
    $user = User::factory()->create();
    $project = Project::factory()->create(['equipment_calibration_max_age_months' => null]);
    $equipment = Equipment::factory()->create(['status' => 'available', 'calibration_required' => true]);

    $this->actingAs($user)
        ->post(route('projects.equipment-checkouts.store', $project), [
            'equipment_id' => $equipment->id,
            'checked_out_at' => now()->toDateTimeString(),
        ])
        ->assertSessionHasNoErrors();
});

test('the same recency rule applies when checking out from the equipment page', function () {
    $user = User::factory()->create();
    $project = Project::factory()->create(['equipment_calibration_max_age_months' => 6]);
    $equipment = Equipment::factory()->create(['status' => 'available', 'calibration_required' => true]);
    $equipment->calibrations()->create([
        'calibration_date' => now()->subMonths(9),
        'due_date' => now()->addMonths(3),
        'result' => 'passed',
        'created_by' => $user->id,
    ]);

    $this->actingAs($user)
        ->post(route('equipment.assignments.store', $equipment), [
            'project_id' => $project->id,
            'checked_out_at' => now()->toDateTimeString(),
        ])
        ->assertSessionHasErrors('project_id');
});

test('equipment search excludes non-compliant tools when a project is given', function () {
    $user = User::factory()->create();
    $project = Project::factory()->create(['equipment_calibration_max_age_months' => 6]);

    $compliant = Equipment::factory()->create(['name' => 'Fresh Multimeter', 'status' => 'available', 'calibration_required' => true]);
    $compliant->calibrations()->create([
        'calibration_date' => now()->subMonth(),
        'due_date' => now()->addMonths(11),
        'result' => 'passed',
        'created_by' => $user->id,
    ]);

    $stale = Equipment::factory()->create(['name' => 'Stale Caliper', 'status' => 'available', 'calibration_required' => true]);
    $stale->calibrations()->create([
        'calibration_date' => now()->subMonths(10),
        'due_date' => now()->addMonths(2),
        'result' => 'passed',
        'created_by' => $user->id,
    ]);

    $response = $this->actingAs($user)->get(route('equipment.search', ['project' => $project->id]));

    $names = collect($response->json('data'))->pluck('name');
    expect($names)->toContain('Fresh Multimeter');
    expect($names)->not->toContain('Stale Caliper');
});

test('the project page flags equipment that has drifted out of compliance while checked out', function () {
    $user = User::factory()->create();
    $project = Project::factory()->create(['equipment_calibration_max_age_months' => 6]);
    $equipment = Equipment::factory()->create(['status' => 'in_use', 'calibration_required' => true]);
    $equipment->calibrations()->create([
        'calibration_date' => now()->subMonths(9),
        'due_date' => now()->addMonths(3),
        'result' => 'passed',
        'created_by' => $user->id,
    ]);
    $equipment->checkOut([
        'project_id' => $project->id,
        'checked_out_at' => now()->subDay(),
        'created_by' => $user->id,
    ]);

    $response = $this->actingAs($user)->get(route('projects.show', $project));

    $response->assertInertia(fn (Assert $page) => $page
        ->where('equipmentAssignments.0.calibration_compliant', false)
    );
});

test('the project page still shows equipment after it has been returned', function () {
    $user = User::factory()->create();
    $project = Project::factory()->create();
    $equipment = Equipment::factory()->create(['status' => 'available']);

    $assignment = $equipment->checkOut([
        'project_id' => $project->id,
        'checked_out_at' => now()->subDay(),
        'created_by' => $user->id,
    ]);
    $assignment->update(['returned_at' => now()]);
    $equipment->syncCurrentAssignment();

    $response = $this->actingAs($user)->get(route('projects.show', $project));

    $response->assertInertia(fn (Assert $page) => $page
        ->has('equipmentAssignments', 1)
        ->where('equipmentAssignments.0.equipment.id', $equipment->id)
        ->where('equipmentAssignments.0.calibration_compliant', null)
        ->whereNot('equipmentAssignments.0.returned_at', null)
    );
});
