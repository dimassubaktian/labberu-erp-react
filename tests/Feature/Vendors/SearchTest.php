<?php

use App\Models\User;
use App\Models\Vendor;

test('vendors can be searched by name', function () {
    $user = User::factory()->create();
    Vendor::factory()->create(['name' => 'Acme Steel Supply']);
    Vendor::factory()->create(['name' => 'Bolt & Fastener Co']);

    $this->actingAs($user)
        ->getJson(route('vendors.search', ['q' => 'Acme']))
        ->assertOk()
        ->assertJsonCount(1, 'data')
        ->assertJsonFragment(['name' => 'Acme Steel Supply']);
});

test('vendors can be searched by vendor code', function () {
    $user = User::factory()->create();
    $vendor = Vendor::factory()->create(['name' => 'Acme Steel Supply']);
    Vendor::factory()->create(['name' => 'Bolt & Fastener Co']);

    $this->actingAs($user)
        ->getJson(route('vendors.search', ['q' => $vendor->vendor_code]))
        ->assertOk()
        ->assertJsonCount(1, 'data')
        ->assertJsonFragment(['id' => $vendor->id]);
});

test('trashed vendors are not returned by search', function () {
    $user = User::factory()->create();
    Vendor::factory()->create(['name' => 'Deleted Vendor'])->delete();

    $this->actingAs($user)
        ->getJson(route('vendors.search', ['q' => 'Deleted']))
        ->assertJsonCount(0, 'data');
});

test('guests cannot search vendors', function () {
    $this->getJson(route('vendors.search'))
        ->assertUnauthorized();
});
