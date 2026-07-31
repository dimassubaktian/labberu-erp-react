<?php

use App\Models\User;
use App\Models\Vendor;
use Inertia\Testing\AssertableInertia as Assert;

test('vendor detail page is displayed', function () {
    $user = User::factory()->create();
    $vendor = Vendor::factory()->create(['name' => 'Nusalink Bridge']);

    $this->actingAs($user)
        ->get(route('vendors.show', $vendor))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('vendors/show')
            ->where('vendor.uuid', $vendor->uuid)
            ->where('vendor.name', 'Nusalink Bridge'),
        );
});

test('vendor detail page is resolved by uuid, not the numeric id', function () {
    $user = User::factory()->create();
    $vendor = Vendor::factory()->create();

    $this->actingAs($user)
        ->get(route('vendors.show', $vendor))
        ->assertOk();

    expect(route('vendors.show', $vendor))->toContain($vendor->uuid);
});

test('trashed vendors are not found', function () {
    $user = User::factory()->create();
    $vendor = Vendor::factory()->create();
    $vendor->delete();

    $this->actingAs($user)
        ->get(route('vendors.show', $vendor))
        ->assertNotFound();
});

test('guests cannot view a vendor', function () {
    $vendor = Vendor::factory()->create();

    $this->get(route('vendors.show', $vendor))
        ->assertRedirect(route('login'));
});
