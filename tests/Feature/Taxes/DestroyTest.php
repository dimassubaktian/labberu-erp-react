<?php

use App\Models\Tax;
use App\Models\User;

test('tax can be deleted', function () {
    $user = User::factory()->create();
    $tax = Tax::factory()->create();

    $response = $this->actingAs($user)
        ->delete(route('taxes.destroy', $tax));

    $response->assertRedirect(route('taxes.index'));

    $this->assertSoftDeleted($tax);
});

test('guests cannot delete taxes', function () {
    $tax = Tax::factory()->create();

    $this->delete(route('taxes.destroy', $tax))
        ->assertRedirect(route('login'));

    $this->assertNotSoftDeleted($tax);
});
