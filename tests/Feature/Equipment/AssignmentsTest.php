<?php

use App\Models\Equipment;
use App\Models\Project;
use App\Models\User;
use App\Models\Workforce;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;

test('equipment can be checked out to a project', function () {
    $user = User::factory()->create();
    $equipment = Equipment::factory()->create(['status' => 'available']);
    $project = Project::factory()->create();

    $response = $this->actingAs($user)->post(route('equipment.assignments.store', $equipment), [
        'project_id' => $project->id,
        'checked_out_at' => now()->toDateTimeString(),
    ]);

    $response
        ->assertSessionHasNoErrors()
        ->assertRedirect(route('equipment.show', $equipment));

    $equipment->refresh();
    expect($equipment->status)->toBe('in_use');
    expect($equipment->current_project_id)->toBe($project->id);

    $assignment = $equipment->assignments()->sole();
    expect($assignment->created_by)->toBe($user->id);
    expect($assignment->returned_at)->toBeNull();
});

test('equipment that is not available cannot be checked out', function (string $status) {
    $user = User::factory()->create();
    $equipment = Equipment::factory()->create(['status' => $status]);
    $project = Project::factory()->create();

    $response = $this->actingAs($user)->post(route('equipment.assignments.store', $equipment), [
        'project_id' => $project->id,
        'checked_out_at' => now()->toDateTimeString(),
    ]);

    $response->assertForbidden();
    expect($equipment->assignments()->count())->toBe(0);
})->with(['in_use', 'in_calibration', 'under_maintenance', 'retired', 'lost', 'damaged']);

test('equipment already checked out cannot be checked out again without returning first', function () {
    $user = User::factory()->create();
    $equipment = Equipment::factory()->create();
    $firstProject = Project::factory()->create();
    $secondProject = Project::factory()->create();

    $this->actingAs($user)->post(route('equipment.assignments.store', $equipment), [
        'project_id' => $firstProject->id,
        'checked_out_at' => now()->subDay()->toDateTimeString(),
    ]);

    $response = $this->actingAs($user)->post(route('equipment.assignments.store', $equipment), [
        'project_id' => $secondProject->id,
        'checked_out_at' => now()->toDateTimeString(),
    ]);

    $response->assertForbidden();
    expect($equipment->assignments()->whereNull('returned_at')->count())->toBe(1);
    expect($equipment->refresh()->current_project_id)->toBe($firstProject->id);
});

test('equipment can be returned to storage as available', function () {
    $user = User::factory()->create();
    $equipment = Equipment::factory()->create();
    $custodian = Workforce::factory()->create();

    $this->actingAs($user)->post(route('equipment.assignments.store', $equipment), [
        'custodian_id' => $custodian->id,
        'checked_out_at' => now()->toDateTimeString(),
    ]);

    $assignment = $equipment->assignments()->sole();

    $response = $this->actingAs($user)->patch(route('equipment.assignments.return', [$equipment, $assignment]), [
        'status' => 'available',
        'notes' => 'Returned in good condition',
    ]);

    $response
        ->assertSessionHasNoErrors()
        ->assertRedirect(route('equipment.show', $equipment));

    expect($assignment->refresh()->returned_at)->not->toBeNull();
    expect($equipment->refresh()->status)->toBe('available');
    expect($equipment->current_project_id)->toBeNull();
    expect($equipment->current_custodian_id)->toBeNull();
});

test('equipment returned in a bad condition is marked with that status', function () {
    $user = User::factory()->create();
    $equipment = Equipment::factory()->create();
    $project = Project::factory()->create();

    $this->actingAs($user)->post(route('equipment.assignments.store', $equipment), [
        'project_id' => $project->id,
        'checked_out_at' => now()->toDateTimeString(),
    ]);

    $assignment = $equipment->assignments()->sole();

    $response = $this->actingAs($user)->patch(route('equipment.assignments.return', [$equipment, $assignment]), [
        'status' => 'damaged',
        'notes' => 'Casing cracked, display no longer lights up.',
    ]);

    $response->assertSessionHasNoErrors();

    expect($equipment->refresh()->status)->toBe('damaged');
    expect($assignment->refresh()->notes)->toBe('Casing cracked, display no longer lights up.');
});

test('remarks are required when the returned equipment is not simply available again', function () {
    $user = User::factory()->create();
    $equipment = Equipment::factory()->create();

    $this->actingAs($user)->post(route('equipment.assignments.store', $equipment), [
        'checked_out_at' => now()->toDateTimeString(),
    ]);

    $assignment = $equipment->assignments()->sole();

    $this->actingAs($user)
        ->patch(route('equipment.assignments.return', [$equipment, $assignment]), [
            'status' => 'lost',
        ])
        ->assertSessionHasErrors('notes');
});

test('an already-returned assignment cannot be returned again', function () {
    $user = User::factory()->create();
    $equipment = Equipment::factory()->create();
    $assignment = $equipment->assignments()->create([
        'checked_out_at' => now()->subDay(),
        'returned_at' => now(),
        'created_by' => $user->id,
    ]);

    $this->actingAs($user)
        ->patch(route('equipment.assignments.return', [$equipment, $assignment]), [])
        ->assertForbidden();
});

test('a proof photo can be recorded when checking out equipment', function () {
    Storage::fake('local');

    $user = User::factory()->create();
    $equipment = Equipment::factory()->create(['status' => 'available']);
    $project = Project::factory()->create();

    $response = $this->actingAs($user)->post(route('equipment.assignments.store', $equipment), [
        'project_id' => $project->id,
        'checked_out_at' => now()->toDateTimeString(),
        'checkout_photo' => UploadedFile::fake()->image('checkout.jpg'),
    ]);

    $response->assertSessionHasNoErrors();

    $assignment = $equipment->assignments()->sole();
    expect($assignment->checkout_photo)->not->toBeNull();
    Storage::disk('local')->assertExists($assignment->checkout_photo);

    $this->actingAs($user)
        ->get(route('equipment.assignments.checkout-photo', [$equipment, $assignment]))
        ->assertOk();
});

test('a proof photo can be recorded when returning equipment', function () {
    Storage::fake('local');

    $user = User::factory()->create();
    $equipment = Equipment::factory()->create();

    $this->actingAs($user)->post(route('equipment.assignments.store', $equipment), [
        'checked_out_at' => now()->toDateTimeString(),
    ]);

    $assignment = $equipment->assignments()->sole();

    $response = $this->actingAs($user)->patch(route('equipment.assignments.return', [$equipment, $assignment]), [
        'status' => 'available',
        'return_photo' => UploadedFile::fake()->image('return.jpg'),
    ]);

    $response->assertSessionHasNoErrors();

    $assignment->refresh();
    expect($assignment->return_photo)->not->toBeNull();
    Storage::disk('local')->assertExists($assignment->return_photo);

    $this->actingAs($user)
        ->get(route('equipment.assignments.return-photo', [$equipment, $assignment]))
        ->assertOk();
});

test('proof photos 404 when none was recorded', function () {
    $user = User::factory()->create();
    $equipment = Equipment::factory()->create();
    $assignment = $equipment->assignments()->create([
        'checked_out_at' => now(),
        'created_by' => $user->id,
    ]);

    $this->actingAs($user)
        ->get(route('equipment.assignments.checkout-photo', [$equipment, $assignment]))
        ->assertNotFound();

    $this->actingAs($user)
        ->get(route('equipment.assignments.return-photo', [$equipment, $assignment]))
        ->assertNotFound();
});

test('guests cannot view proof photos', function () {
    $equipment = Equipment::factory()->create();
    $assignment = $equipment->assignments()->create([
        'checked_out_at' => now(),
        'created_by' => User::factory()->create()->id,
    ]);

    $this->get(route('equipment.assignments.checkout-photo', [$equipment, $assignment]))
        ->assertRedirect(route('login'));

    $this->get(route('equipment.assignments.return-photo', [$equipment, $assignment]))
        ->assertRedirect(route('login'));
});

test('guests cannot check out or return equipment', function () {
    $equipment = Equipment::factory()->create();
    $assignment = $equipment->assignments()->create([
        'checked_out_at' => now(),
        'created_by' => User::factory()->create()->id,
    ]);

    $this->post(route('equipment.assignments.store', $equipment), [])
        ->assertRedirect(route('login'));

    $this->patch(route('equipment.assignments.return', [$equipment, $assignment]), [])
        ->assertRedirect(route('login'));
});
