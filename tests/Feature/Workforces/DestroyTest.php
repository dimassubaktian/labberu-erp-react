<?php

use App\Models\User;
use App\Models\Workforce;

test('workforce can be deleted', function () {
    $user = User::factory()->create();
    $workforce = Workforce::factory()->create();

    $response = $this->actingAs($user)
        ->delete(route('workforces.destroy', $workforce));

    $response->assertRedirect(route('workforces.index'));

    $this->assertSoftDeleted($workforce);
});

test('guests cannot delete workforces', function () {
    $workforce = Workforce::factory()->create();

    $this->delete(route('workforces.destroy', $workforce))
        ->assertRedirect(route('login'));

    $this->assertNotSoftDeleted($workforce);
});
