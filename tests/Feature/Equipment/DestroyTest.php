<?php

use App\Models\Equipment;
use App\Models\User;

test('equipment can be deleted', function () {
    $user = User::factory()->create();
    $equipment = Equipment::factory()->create();

    $response = $this->actingAs($user)
        ->delete(route('equipment.destroy', $equipment));

    $response->assertRedirect(route('equipment.index'));

    $this->assertSoftDeleted($equipment);
});

test('guests cannot delete equipment', function () {
    $equipment = Equipment::factory()->create();

    $this->delete(route('equipment.destroy', $equipment))
        ->assertRedirect(route('login'));

    $this->assertNotSoftDeleted($equipment);
});
