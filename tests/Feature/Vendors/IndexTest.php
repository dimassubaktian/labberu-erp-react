<?php

use App\Models\User;
use App\Models\Vendor;
use Inertia\Testing\AssertableInertia as Assert;

test('vendors index page is displayed', function () {
    $user = User::factory()->create();
    Vendor::factory()->create(['name' => 'Nusalink Bridge']);
    Vendor::factory()->create(['name' => 'Acme Corp']);

    $this->actingAs($user)
        ->get(route('vendors.index'))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('vendors/index')
            ->has('vendors.data', 2),
        );
});

test('trashed vendors are not listed', function () {
    $user = User::factory()->create();
    Vendor::factory()->create();
    Vendor::factory()->create()->delete();

    $this->actingAs($user)
        ->get(route('vendors.index'))
        ->assertInertia(fn (Assert $page) => $page
            ->has('vendors.data', 1),
        );
});

test('guests cannot view vendors', function () {
    $this->get(route('vendors.index'))
        ->assertRedirect(route('login'));
});
