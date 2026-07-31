<?php

use App\Models\Tax;
use App\Models\User;
use Inertia\Testing\AssertableInertia as Assert;

test('tax edit page is displayed', function () {
    $user = User::factory()->create();
    $tax = Tax::factory()->create(['name' => 'Value Added Tax']);

    $this->actingAs($user)
        ->get(route('taxes.edit', $tax))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('taxes/edit')
            ->where('tax.uuid', $tax->uuid)
            ->where('tax.name', 'Value Added Tax'),
        );
});

test('tax can be updated', function () {
    $user = User::factory()->create();
    $tax = Tax::factory()->create([
        'code' => 'VAT',
        'name' => 'Value Added Tax',
        'rate' => '10.00',
        'type' => 'percentage',
    ]);

    $response = $this->actingAs($user)
        ->put(route('taxes.update', $tax), [
            'code' => 'ppn',
            'name' => 'Pajak Pertambahan Nilai',
            'rate' => '11.00',
            'type' => 'percentage',
        ]);

    $response
        ->assertSessionHasNoErrors()
        ->assertRedirect(route('taxes.show', $tax));

    $this->assertDatabaseHas('taxes', [
        'id' => $tax->id,
        'code' => 'PPN',
        'name' => 'Pajak Pertambahan Nilai',
        'rate' => '11.00',
        'type' => 'percentage',
    ]);
});

test('code must be unique except for itself', function () {
    $user = User::factory()->create();
    $tax = Tax::factory()->create(['code' => 'VAT']);

    $this->actingAs($user)
        ->put(route('taxes.update', $tax), [
            'code' => 'vat',
            'name' => $tax->name,
            'rate' => $tax->rate,
            'type' => $tax->type,
        ])
        ->assertSessionHasNoErrors();
});

test('code must be unique against other taxes', function () {
    $user = User::factory()->create();
    Tax::factory()->create(['code' => 'VAT']);
    $tax = Tax::factory()->create(['code' => 'PPH21']);

    $this->actingAs($user)
        ->put(route('taxes.update', $tax), [
            'code' => 'VAT',
            'name' => $tax->name,
            'rate' => $tax->rate,
            'type' => $tax->type,
        ])
        ->assertSessionHasErrors('code');
});

test('type must be percentage or fixed', function () {
    $user = User::factory()->create();
    $tax = Tax::factory()->create();

    $this->actingAs($user)
        ->put(route('taxes.update', $tax), [
            'code' => $tax->code,
            'name' => $tax->name,
            'rate' => $tax->rate,
            'type' => 'flat',
        ])
        ->assertSessionHasErrors('type');
});

test('guests cannot edit or update taxes', function () {
    $tax = Tax::factory()->create();

    $this->get(route('taxes.edit', $tax))
        ->assertRedirect(route('login'));

    $this->put(route('taxes.update', $tax), [])
        ->assertRedirect(route('login'));
});
