<?php

use App\Models\Equipment;
use App\Models\User;

test('equipment search only returns available equipment', function () {
    $user = User::factory()->create();
    $available = Equipment::factory()->create(['name' => 'Available Multimeter', 'status' => 'available']);
    Equipment::factory()->create(['name' => 'In Use Caliper', 'status' => 'in_use']);
    Equipment::factory()->create(['name' => 'Retired Wrench', 'status' => 'retired']);

    $response = $this->actingAs($user)->get(route('equipment.search'));

    $response->assertOk();
    $names = collect($response->json('data'))->pluck('name');

    expect($names)->toContain('Available Multimeter');
    expect($names)->not->toContain('In Use Caliper');
    expect($names)->not->toContain('Retired Wrench');
});

test('equipment search filters by query', function () {
    $user = User::factory()->create();
    Equipment::factory()->create(['name' => 'Digital Multimeter', 'status' => 'available']);
    Equipment::factory()->create(['name' => 'Vernier Caliper', 'status' => 'available']);

    $response = $this->actingAs($user)->get(route('equipment.search', ['q' => 'Multimeter']));

    $names = collect($response->json('data'))->pluck('name');
    expect($names)->toContain('Digital Multimeter');
    expect($names)->not->toContain('Vernier Caliper');
});

test('guests cannot search equipment', function () {
    $this->get(route('equipment.search'))
        ->assertRedirect(route('login'));
});
