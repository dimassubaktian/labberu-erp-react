<?php

use App\Models\Equipment;
use App\Models\User;
use Inertia\Testing\AssertableInertia as Assert;

test('equipment show page is displayed', function () {
    $user = User::factory()->create();
    $equipment = Equipment::factory()->create();

    $this->actingAs($user)
        ->get(route('equipment.show', $equipment))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('equipment/show')
            ->where('equipment.id', $equipment->id),
        );
});

test('equipment index page is displayed', function () {
    $user = User::factory()->create();
    Equipment::factory()->count(3)->create();

    $this->actingAs($user)
        ->get(route('equipment.index'))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('equipment/index')
            ->has('equipment.data', 3),
        );
});
