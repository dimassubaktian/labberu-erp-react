<?php

use App\Models\Equipment;
use App\Models\EquipmentLocation;
use App\Models\User;

test('equipment can be moved to a storage location', function () {
    $user = User::factory()->create();
    $equipment = Equipment::factory()->create();
    $location = EquipmentLocation::factory()->create();

    $response = $this->actingAs($user)->post(route('equipment.location-moves.store', $equipment), [
        'location_id' => $location->id,
        'moved_at' => now()->toDateTimeString(),
    ]);

    $response
        ->assertSessionHasNoErrors()
        ->assertRedirect(route('equipment.show', $equipment));

    $equipment->refresh();
    expect($equipment->location_id)->toBe($location->id);

    $move = $equipment->locationMoves()->sole();
    expect($move->location_id)->toBe($location->id);
    expect($move->created_by)->toBe($user->id);
});

test('moving equipment again records a new move without erasing history', function () {
    $user = User::factory()->create();
    $equipment = Equipment::factory()->create();
    $firstLocation = EquipmentLocation::factory()->create();
    $secondLocation = EquipmentLocation::factory()->create();

    $this->actingAs($user)->post(route('equipment.location-moves.store', $equipment), [
        'location_id' => $firstLocation->id,
        'moved_at' => now()->subDay()->toDateTimeString(),
    ]);

    $this->actingAs($user)->post(route('equipment.location-moves.store', $equipment), [
        'location_id' => $secondLocation->id,
        'moved_at' => now()->toDateTimeString(),
    ]);

    expect($equipment->refresh()->location_id)->toBe($secondLocation->id);
    expect($equipment->locationMoves()->count())->toBe(2);
});

test('moving equipment location does not affect its custody status', function () {
    $user = User::factory()->create();
    $equipment = Equipment::factory()->create(['status' => 'in_use', 'current_custodian_id' => null]);
    $location = EquipmentLocation::factory()->create();

    $this->actingAs($user)->post(route('equipment.location-moves.store', $equipment), [
        'location_id' => $location->id,
        'moved_at' => now()->toDateTimeString(),
    ]);

    expect($equipment->refresh()->status)->toBe('in_use');
});

test('location and required fields are validated', function () {
    $user = User::factory()->create();
    $equipment = Equipment::factory()->create();

    $this->actingAs($user)
        ->post(route('equipment.location-moves.store', $equipment), [])
        ->assertSessionHasErrors(['location_id', 'moved_at']);
});

test('a soft-deleted location cannot be moved to', function () {
    $user = User::factory()->create();
    $equipment = Equipment::factory()->create();
    $location = EquipmentLocation::factory()->create();
    $location->delete();

    $this->actingAs($user)
        ->post(route('equipment.location-moves.store', $equipment), [
            'location_id' => $location->id,
            'moved_at' => now()->toDateTimeString(),
        ])
        ->assertSessionHasErrors('location_id');
});

test('guests cannot move equipment', function () {
    $equipment = Equipment::factory()->create();
    $location = EquipmentLocation::factory()->create();

    $this->post(route('equipment.location-moves.store', $equipment), [
        'location_id' => $location->id,
        'moved_at' => now()->toDateTimeString(),
    ])->assertRedirect(route('login'));
});
