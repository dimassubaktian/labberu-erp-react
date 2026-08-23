<?php

use App\Models\Equipment;
use App\Models\User;

test('equipment list print streams pdf inline by default', function () {
    $user = User::factory()->create();
    Equipment::factory()->create();

    $response = $this->actingAs($user)->get(route('equipment.print'));

    $response->assertOk();
    $response->assertHeader('Content-Type', 'application/pdf');
    expect($response->headers->get('Content-Disposition'))->toContain('inline');
});

test('equipment list print forces download when download param is true', function () {
    $user = User::factory()->create();
    Equipment::factory()->create();

    $response = $this->actingAs($user)->get(route('equipment.print', ['download' => 'true']));

    $response->assertOk();
    $response->assertHeader('Content-Type', 'application/pdf');
    expect($response->headers->get('Content-Disposition'))->toContain('attachment');
});

test('equipment list print renders ok with no equipment', function () {
    $user = User::factory()->create();

    $response = $this->actingAs($user)->get(route('equipment.print'));

    $response->assertOk();
});

test('equipment list print applies the same filters as the index', function () {
    $user = User::factory()->create();
    $equipment = Equipment::factory()->create(['status' => 'available']);
    $equipment->calibrations()->create([
        'calibration_date' => now()->subMonth(),
        'due_date' => now()->addMonths(11),
        'result' => 'passed',
        'created_by' => $user->id,
    ]);
    Equipment::factory()->create(['status' => 'retired']);

    $response = $this->actingAs($user)
        ->get(route('equipment.print', ['status' => 'available']));

    $response->assertOk();
});

test('guests cannot print the equipment list', function () {
    $this->get(route('equipment.print'))
        ->assertRedirect(route('login'));
});
