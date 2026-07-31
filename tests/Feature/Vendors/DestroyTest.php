<?php

use App\Models\User;
use App\Models\Vendor;

test('vendor can be deleted', function () {
    $user = User::factory()->create();
    $vendor = Vendor::factory()->create();

    $response = $this->actingAs($user)
        ->delete(route('vendors.destroy', $vendor));

    $response->assertRedirect(route('vendors.index'));

    $this->assertSoftDeleted($vendor);
});

test('guests cannot delete vendors', function () {
    $vendor = Vendor::factory()->create();

    $this->delete(route('vendors.destroy', $vendor))
        ->assertRedirect(route('login'));

    $this->assertNotSoftDeleted($vendor);
});
