<?php

use App\Models\Customer;
use App\Models\User;
use App\Models\Vendor;
use Inertia\Testing\AssertableInertia as Assert;

test('vendor create page is displayed', function () {
    $user = User::factory()->create();

    $this->actingAs($user)
        ->get(route('vendors.create'))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('vendors/create'),
        );
});

test('vendor can be created', function () {
    $user = User::factory()->create();

    $response = $this->actingAs($user)
        ->post(route('vendors.store'), [
            'name' => 'Nusalink Bridge',
            'attention' => 'Jane Doe',
            'phone' => '021-5551234',
            'fax' => '021-5551235',
            'address' => 'Jl. Sudirman No. 1',
            'city' => 'Jakarta',
            'province' => 'DKI Jakarta',
            'country' => 'Indonesia',
            'postal_code' => '10220',
            'remarks' => 'Preferred vendor',
        ]);

    $response->assertSessionHasNoErrors();

    $vendor = Vendor::sole();

    $response->assertRedirect(route('vendors.show', $vendor));

    $this->assertDatabaseHas('vendors', [
        'name' => 'Nusalink Bridge',
        'attention' => 'Jane Doe',
        'phone' => '021-5551234',
        'city' => 'Jakarta',
    ]);
});

test('vendor code is generated from the first letter of the name', function () {
    $user = User::factory()->create();

    $this->actingAs($user)->post(route('vendors.store'), [
        'name' => 'Nusalink Bridge',
    ]);

    $this->assertDatabaseHas('vendors', ['vendor_code' => 'N001']);
});

test('vendor code shares the sequence with customer code', function () {
    $user = User::factory()->create();

    Customer::factory()->create(['name' => 'Nusalink Bridge']);

    $this->actingAs($user)->post(route('vendors.store'), [
        'name' => 'Nusalink Group',
    ]);

    $this->assertDatabaseHas('vendors', ['vendor_code' => 'N002']);
});

test('only name is required', function () {
    $user = User::factory()->create();

    $response = $this->actingAs($user)
        ->post(route('vendors.store'), [
            'name' => 'Acme Corp',
        ]);

    $response->assertSessionHasNoErrors();

    $vendor = Vendor::sole();

    $response->assertRedirect(route('vendors.show', $vendor));

    $this->assertDatabaseHas('vendors', ['name' => 'Acme Corp']);
});

test('name is required', function () {
    $user = User::factory()->create();

    $this->actingAs($user)
        ->post(route('vendors.store'), [])
        ->assertSessionHasErrors(['name']);
});

test('guests cannot create vendors', function () {
    $this->get(route('vendors.create'))
        ->assertRedirect(route('login'));

    $this->post(route('vendors.store'), [])
        ->assertRedirect(route('login'));
});
