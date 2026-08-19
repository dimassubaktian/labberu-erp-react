<?php

use App\Models\EquipmentLocation;
use App\Models\User;
use Inertia\Testing\AssertableInertia as Assert;

test('equipment location edit page is displayed', function () {
    $user = User::factory()->create();
    $location = EquipmentLocation::factory()->create(['name' => 'Warehouse A']);

    $this->actingAs($user)
        ->get(route('equipment-locations.edit', $location))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('equipment-locations/edit')
            ->where('location.uuid', $location->uuid)
            ->where('location.name', 'Warehouse A'),
        );
});

test('equipment location can be updated', function () {
    $user = User::factory()->create();
    $location = EquipmentLocation::factory()->create([
        'name' => 'Warehouse A',
        'code' => 'WH-A',
        'is_active' => true,
    ]);

    $response = $this->actingAs($user)
        ->put(route('equipment-locations.update', $location), [
            'name' => 'Warehouse B',
            'code' => 'WH-B',
            'description' => 'Relocated',
            'is_active' => false,
        ]);

    $response
        ->assertSessionHasNoErrors()
        ->assertRedirect(route('equipment-locations.show', $location));

    $this->assertDatabaseHas('equipment_locations', [
        'id' => $location->id,
        'name' => 'Warehouse B',
        'code' => 'WH-B',
        'description' => 'Relocated',
        'is_active' => false,
    ]);
});

test('code must be unique except for itself', function () {
    $user = User::factory()->create();
    $location = EquipmentLocation::factory()->create(['code' => 'WH-A']);

    $this->actingAs($user)
        ->put(route('equipment-locations.update', $location), [
            'name' => $location->name,
            'code' => 'WH-A',
            'is_active' => true,
        ])
        ->assertSessionHasNoErrors();
});

test('code must be unique against other locations', function () {
    $user = User::factory()->create();
    EquipmentLocation::factory()->create(['code' => 'WH-A']);
    $location = EquipmentLocation::factory()->create(['code' => 'WH-B']);

    $this->actingAs($user)
        ->put(route('equipment-locations.update', $location), [
            'name' => $location->name,
            'code' => 'WH-A',
            'is_active' => true,
        ])
        ->assertSessionHasErrors('code');
});

test('guests cannot edit or update equipment locations', function () {
    $location = EquipmentLocation::factory()->create();

    $this->get(route('equipment-locations.edit', $location))
        ->assertRedirect(route('login'));

    $this->put(route('equipment-locations.update', $location), [])
        ->assertRedirect(route('login'));
});
