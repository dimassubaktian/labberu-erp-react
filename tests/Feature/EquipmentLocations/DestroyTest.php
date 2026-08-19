<?php

use App\Models\EquipmentLocation;
use App\Models\User;

test('equipment location can be deleted', function () {
    $user = User::factory()->create();
    $location = EquipmentLocation::factory()->create();

    $response = $this->actingAs($user)
        ->delete(route('equipment-locations.destroy', $location));

    $response->assertRedirect(route('equipment-locations.index'));

    $this->assertSoftDeleted($location);
});

test('guests cannot delete equipment locations', function () {
    $location = EquipmentLocation::factory()->create();

    $this->delete(route('equipment-locations.destroy', $location))
        ->assertRedirect(route('login'));

    $this->assertNotSoftDeleted($location);
});
