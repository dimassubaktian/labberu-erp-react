<?php

use App\Models\Equipment;
use App\Models\Project;
use App\Models\User;
use App\Models\Workforce;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Inertia\Testing\AssertableInertia as Assert;

test('available equipment can be checked out to a project from the project page', function () {
    $user = User::factory()->create();
    $project = Project::factory()->create();
    $equipment = Equipment::factory()->create(['status' => 'available']);

    $response = $this->actingAs($user)->post(route('projects.equipment-checkouts.store', $project), [
        'equipment_id' => $equipment->id,
        'checked_out_at' => now()->toDateTimeString(),
    ]);

    $response
        ->assertSessionHasNoErrors()
        ->assertRedirect(route('projects.show', $project));

    $equipment->refresh();
    expect($equipment->status)->toBe('in_use');
    expect($equipment->current_project_id)->toBe($project->id);

    $assignment = $equipment->assignments()->sole();
    expect($assignment->project_id)->toBe($project->id);
    expect($assignment->created_by)->toBe($user->id);
});

test('a custodian can be recorded alongside the project on checkout', function () {
    $user = User::factory()->create();
    $project = Project::factory()->create();
    $equipment = Equipment::factory()->create(['status' => 'available']);
    $custodian = Workforce::factory()->create();

    $this->actingAs($user)->post(route('projects.equipment-checkouts.store', $project), [
        'equipment_id' => $equipment->id,
        'custodian_id' => $custodian->id,
        'checked_out_at' => now()->toDateTimeString(),
    ]);

    $assignment = $equipment->assignments()->sole();
    expect($assignment->custodian_id)->toBe($custodian->id);
    expect($equipment->refresh()->current_custodian_id)->toBe($custodian->id);
});

test('equipment that is not available cannot be checked out', function () {
    $user = User::factory()->create();
    $project = Project::factory()->create();
    $equipment = Equipment::factory()->create(['status' => 'in_use']);

    $this->actingAs($user)
        ->post(route('projects.equipment-checkouts.store', $project), [
            'equipment_id' => $equipment->id,
            'checked_out_at' => now()->toDateTimeString(),
        ])
        ->assertSessionHasErrors('equipment_id');
});

test('equipment already checked out to another project cannot be checked out from a different project page', function () {
    $user = User::factory()->create();
    $firstProject = Project::factory()->create();
    $secondProject = Project::factory()->create();
    $equipment = Equipment::factory()->create(['status' => 'available']);

    $equipment->checkOut([
        'project_id' => $firstProject->id,
        'checked_out_at' => now()->subDay(),
        'created_by' => $user->id,
    ]);

    $this->actingAs($user)
        ->post(route('projects.equipment-checkouts.store', $secondProject), [
            'equipment_id' => $equipment->id,
            'checked_out_at' => now()->toDateTimeString(),
        ])
        ->assertSessionHasErrors('equipment_id');

    expect($equipment->refresh()->current_project_id)->toBe($firstProject->id);
});

test('equipment can be checked out to a new project once it becomes available again', function () {
    $user = User::factory()->create();
    $firstProject = Project::factory()->create();
    $secondProject = Project::factory()->create();
    $equipment = Equipment::factory()->create(['status' => 'available']);

    $firstAssignment = $equipment->checkOut([
        'project_id' => $firstProject->id,
        'checked_out_at' => now()->subDay(),
        'created_by' => $user->id,
    ]);
    $firstAssignment->update(['returned_at' => now()]);
    $equipment->syncCurrentAssignment();

    $this->actingAs($user)->post(route('projects.equipment-checkouts.store', $secondProject), [
        'equipment_id' => $equipment->id,
        'checked_out_at' => now()->toDateTimeString(),
    ])->assertSessionHasNoErrors();

    expect($equipment->assignments()->whereNull('returned_at')->count())->toBe(1);
    expect($equipment->refresh()->current_project_id)->toBe($secondProject->id);
});

test('returned equipment still appears in the project page history, not just currently-assigned tools', function () {
    $user = User::factory()->create();
    $project = Project::factory()->create();
    $equipment = Equipment::factory()->create(['status' => 'available']);

    $this->actingAs($user)->post(route('projects.equipment-checkouts.store', $project), [
        'equipment_id' => $equipment->id,
        'checked_out_at' => now()->subDay()->toDateTimeString(),
    ]);

    $assignment = $equipment->assignments()->sole();

    $this->actingAs($user)->patch(route('equipment.assignments.return', [$equipment, $assignment]), [
        'status' => 'available',
    ]);

    $response = $this->actingAs($user)->get(route('projects.show', $project));

    $response->assertInertia(fn (Assert $page) => $page
        ->has('equipmentAssignments', 1)
        ->where('equipmentAssignments.0.equipment.id', $equipment->id)
        ->whereNot('equipmentAssignments.0.returned_at', null)
    );
});

test('a proof photo can be recorded when checking out equipment from the project page', function () {
    Storage::fake('local');

    $user = User::factory()->create();
    $project = Project::factory()->create();
    $equipment = Equipment::factory()->create(['status' => 'available']);

    $this->actingAs($user)->post(route('projects.equipment-checkouts.store', $project), [
        'equipment_id' => $equipment->id,
        'checked_out_at' => now()->toDateTimeString(),
        'checkout_photo' => UploadedFile::fake()->image('checkout.jpg'),
    ])->assertSessionHasNoErrors();

    $assignment = $equipment->assignments()->sole();
    expect($assignment->checkout_photo)->not->toBeNull();
    Storage::disk('local')->assertExists($assignment->checkout_photo);
});

test('guests cannot check out equipment from the project page', function () {
    $project = Project::factory()->create();
    $equipment = Equipment::factory()->create(['status' => 'available']);

    $this->post(route('projects.equipment-checkouts.store', $project), [
        'equipment_id' => $equipment->id,
        'checked_out_at' => now()->toDateTimeString(),
    ])->assertRedirect(route('login'));
});
