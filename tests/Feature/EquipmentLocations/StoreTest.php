<?php

use App\Models\EquipmentLocation;
use App\Models\User;
use Inertia\Testing\AssertableInertia as Assert;

test('equipment location create page is displayed', function () {
    $user = User::factory()->create();

    $this->actingAs($user)
        ->get(route('equipment-locations.create'))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('equipment-locations/create'),
        );
});

test('equipment location can be created', function () {
    $user = User::factory()->create();

    $response = $this->actingAs($user)
        ->post(route('equipment-locations.store'), [
            'name' => 'Warehouse A - Shelf 3',
            'code' => 'WH-A-03',
            'description' => 'Ground floor, near the loading dock',
            'is_active' => true,
        ]);

    $response->assertSessionHasNoErrors();

    $location = EquipmentLocation::query()->sole();

    $response->assertRedirect(route('equipment-locations.show', $location));

    $this->assertDatabaseHas('equipment_locations', [
        'name' => 'Warehouse A - Shelf 3',
        'code' => 'WH-A-03',
        'is_active' => true,
    ]);
});

test('required fields are validated', function () {
    $user = User::factory()->create();

    $this->actingAs($user)
        ->post(route('equipment-locations.store'), [])
        ->assertSessionHasErrors(['name']);
});

test('code must be unique', function () {
    $user = User::factory()->create();
    EquipmentLocation::factory()->create(['code' => 'WH-A-03']);

    $this->actingAs($user)
        ->post(route('equipment-locations.store'), [
            'name' => 'Another Location',
            'code' => 'WH-A-03',
            'is_active' => true,
        ])
        ->assertSessionHasErrors('code');
});

test('code stays reserved while the owning location is soft-deleted', function () {
    $user = User::factory()->create();
    $trashed = EquipmentLocation::factory()->create(['code' => 'WH-A-03']);
    $trashed->delete();

    $this->actingAs($user)
        ->post(route('equipment-locations.store'), [
            'name' => 'Warehouse A - Shelf 3',
            'code' => 'WH-A-03',
            'is_active' => true,
        ])
        ->assertSessionHasErrors('code');
});

test('guests cannot create equipment locations', function () {
    $this->get(route('equipment-locations.create'))
        ->assertRedirect(route('login'));

    $this->post(route('equipment-locations.store'), [])
        ->assertRedirect(route('login'));
});
