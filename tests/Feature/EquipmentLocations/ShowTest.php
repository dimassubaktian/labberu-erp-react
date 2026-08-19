<?php

use App\Models\EquipmentLocation;
use App\Models\User;
use Inertia\Testing\AssertableInertia as Assert;

test('equipment location detail page is displayed', function () {
    $user = User::factory()->create();
    $location = EquipmentLocation::factory()->create(['name' => 'Warehouse A']);

    $this->actingAs($user)
        ->get(route('equipment-locations.show', $location))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('equipment-locations/show')
            ->where('location.uuid', $location->uuid)
            ->where('location.name', 'Warehouse A'),
        );
});

test('equipment location detail page is resolved by uuid, not the numeric id', function () {
    $user = User::factory()->create();
    $location = EquipmentLocation::factory()->create();

    $this->actingAs($user)
        ->get(route('equipment-locations.show', $location))
        ->assertOk();

    expect(route('equipment-locations.show', $location))->toContain($location->uuid);
});

test('trashed equipment locations are not found', function () {
    $user = User::factory()->create();
    $location = EquipmentLocation::factory()->create();
    $location->delete();

    $this->actingAs($user)
        ->get(route('equipment-locations.show', $location))
        ->assertNotFound();
});

test('guests cannot view an equipment location', function () {
    $location = EquipmentLocation::factory()->create();

    $this->get(route('equipment-locations.show', $location))
        ->assertRedirect(route('login'));
});
