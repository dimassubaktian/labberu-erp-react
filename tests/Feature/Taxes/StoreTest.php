<?php

use App\Models\Tax;
use App\Models\User;
use Inertia\Testing\AssertableInertia as Assert;

test('tax create page is displayed', function () {
    $user = User::factory()->create();

    $this->actingAs($user)
        ->get(route('taxes.create'))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('taxes/create'),
        );
});

test('tax can be created', function () {
    $user = User::factory()->create();

    $response = $this->actingAs($user)
        ->post(route('taxes.store'), [
            'name' => 'Value Added Tax',
            'code' => 'vat',
            'rate' => '11.00',
            'type' => 'percentage',
        ]);

    $response
        ->assertSessionHasNoErrors()
        ->assertRedirect(route('taxes.index'));

    $this->assertDatabaseHas('taxes', [
        'name' => 'Value Added Tax',
        'code' => 'VAT',
        'rate' => '11.00',
        'type' => 'percentage',
    ]);
});

test('code is normalized to uppercase', function () {
    $user = User::factory()->create();

    $this->actingAs($user)->post(route('taxes.store'), [
        'name' => 'Income Tax',
        'code' => 'pph21',
        'rate' => '5.00',
        'type' => 'fixed',
    ]);

    $this->assertDatabaseHas('taxes', ['code' => 'PPH21']);
});

test('required fields are validated', function () {
    $user = User::factory()->create();

    $this->actingAs($user)
        ->post(route('taxes.store'), [])
        ->assertSessionHasErrors(['name', 'code', 'rate', 'type']);
});

test('type must be percentage or fixed', function () {
    $user = User::factory()->create();

    $this->actingAs($user)
        ->post(route('taxes.store'), [
            'name' => 'Value Added Tax',
            'code' => 'VAT',
            'rate' => '11.00',
            'type' => 'flat',
        ])
        ->assertSessionHasErrors('type');
});

test('rate must be a non-negative number', function () {
    $user = User::factory()->create();

    $this->actingAs($user)
        ->post(route('taxes.store'), [
            'name' => 'Value Added Tax',
            'code' => 'VAT',
            'rate' => '-1',
            'type' => 'percentage',
        ])
        ->assertSessionHasErrors('rate');
});

test('code must be unique', function () {
    $user = User::factory()->create();
    Tax::factory()->create(['code' => 'VAT']);

    $this->actingAs($user)
        ->post(route('taxes.store'), [
            'name' => 'Value Added Tax',
            'code' => 'VAT',
            'rate' => '11.00',
            'type' => 'percentage',
        ])
        ->assertSessionHasErrors('code');
});

test('code of a soft-deleted tax can be reused', function () {
    $user = User::factory()->create();
    $trashed = Tax::factory()->create(['code' => 'VAT']);
    $trashed->delete();

    $response = $this->actingAs($user)
        ->post(route('taxes.store'), [
            'name' => 'Value Added Tax',
            'code' => 'VAT',
            'rate' => '11.00',
            'type' => 'percentage',
        ]);

    $response
        ->assertSessionHasNoErrors()
        ->assertRedirect(route('taxes.index'));

    $this->assertDatabaseHas('taxes', [
        'code' => 'VAT',
        'deleted_at' => null,
    ]);
});

test('guests cannot create taxes', function () {
    $this->get(route('taxes.create'))
        ->assertRedirect(route('login'));

    $this->post(route('taxes.store'), [])
        ->assertRedirect(route('login'));
});
