<?php

use App\Models\Equipment;
use App\Models\User;

test('overdue return count includes only checked-out equipment past its expected return date', function () {
    $user = User::factory()->create();

    $overdue = Equipment::factory()->create();
    $overdue->assignments()->create([
        'checked_out_at' => now()->subDays(10),
        'expected_return_at' => now()->subDays(2),
        'created_by' => $user->id,
    ]);

    $notYetDue = Equipment::factory()->create();
    $notYetDue->assignments()->create([
        'checked_out_at' => now()->subDay(),
        'expected_return_at' => now()->addDays(5),
        'created_by' => $user->id,
    ]);

    $noExpectedReturn = Equipment::factory()->create();
    $noExpectedReturn->assignments()->create([
        'checked_out_at' => now()->subDays(10),
        'created_by' => $user->id,
    ]);

    $alreadyReturnedOverdue = Equipment::factory()->create();
    $alreadyReturnedOverdue->assignments()->create([
        'checked_out_at' => now()->subDays(10),
        'expected_return_at' => now()->subDays(2),
        'returned_at' => now()->subDay(),
        'created_by' => $user->id,
    ]);

    $response = $this->actingAs($user)->get(route('equipment.index'));

    $response->assertOk();
    $response->assertInertia(fn ($page) => $page->where('overdueReturnCount', 1));
});

test('return_status=overdue filters the equipment list to overdue returns only', function () {
    $user = User::factory()->create();

    $overdue = Equipment::factory()->create(['name' => 'Overdue Multimeter']);
    $overdue->assignments()->create([
        'checked_out_at' => now()->subDays(10),
        'expected_return_at' => now()->subDays(2),
        'created_by' => $user->id,
    ]);

    $notOverdue = Equipment::factory()->create(['name' => 'On Time Caliper']);
    $notOverdue->assignments()->create([
        'checked_out_at' => now()->subDay(),
        'expected_return_at' => now()->addDays(5),
        'created_by' => $user->id,
    ]);

    $response = $this->actingAs($user)->get(route('equipment.index', ['return_status' => 'overdue']));

    $response->assertOk();
    $names = collect($response->viewData('page')['props']['equipment']['data'])->pluck('name');

    expect($names)->toContain('Overdue Multimeter');
    expect($names)->not->toContain('On Time Caliper');
});
