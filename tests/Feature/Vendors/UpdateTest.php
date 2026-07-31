<?php

use App\Models\User;
use App\Models\Vendor;
use Inertia\Testing\AssertableInertia as Assert;

test('vendor edit page is displayed', function () {
    $user = User::factory()->create();
    $vendor = Vendor::factory()->create(['name' => 'Nusalink Bridge']);

    $this->actingAs($user)
        ->get(route('vendors.edit', $vendor))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('vendors/edit')
            ->where('vendor.uuid', $vendor->uuid)
            ->where('vendor.name', 'Nusalink Bridge'),
        );
});

test('vendor can be updated', function () {
    $user = User::factory()->create();
    $vendor = Vendor::factory()->create([
        'name' => 'Nusalink Bridge',
        'city' => 'Jakarta',
    ]);

    $response = $this->actingAs($user)
        ->put(route('vendors.update', $vendor), [
            'name' => 'Nusalink Bridge Corp',
            'attention' => 'John Smith',
            'city' => 'Surabaya',
        ]);

    $response
        ->assertSessionHasNoErrors()
        ->assertRedirect(route('vendors.show', $vendor));

    $this->assertDatabaseHas('vendors', [
        'id' => $vendor->id,
        'name' => 'Nusalink Bridge Corp',
        'attention' => 'John Smith',
        'city' => 'Surabaya',
    ]);
});

test('vendor code is not changed by an update', function () {
    $user = User::factory()->create();
    $vendor = Vendor::factory()->create();
    $originalCode = $vendor->vendor_code;

    $this->actingAs($user)->put(route('vendors.update', $vendor), [
        'name' => 'Updated Name',
    ]);

    $this->assertDatabaseHas('vendors', [
        'id' => $vendor->id,
        'vendor_code' => $originalCode,
    ]);
});

test('name is required', function () {
    $user = User::factory()->create();
    $vendor = Vendor::factory()->create();

    $this->actingAs($user)
        ->put(route('vendors.update', $vendor), [])
        ->assertSessionHasErrors(['name']);
});

test('guests cannot edit or update vendors', function () {
    $vendor = Vendor::factory()->create();

    $this->get(route('vendors.edit', $vendor))
        ->assertRedirect(route('login'));

    $this->put(route('vendors.update', $vendor), [])
        ->assertRedirect(route('login'));
});
