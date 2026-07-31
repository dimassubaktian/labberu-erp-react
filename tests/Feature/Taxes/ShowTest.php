<?php

use App\Models\Tax;
use App\Models\User;
use Inertia\Testing\AssertableInertia as Assert;

test('tax detail page is displayed', function () {
    $user = User::factory()->create();
    $tax = Tax::factory()->create(['name' => 'Value Added Tax']);

    $this->actingAs($user)
        ->get(route('taxes.show', $tax))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('taxes/show')
            ->where('tax.uuid', $tax->uuid)
            ->where('tax.name', 'Value Added Tax'),
        );
});

test('tax detail page is resolved by uuid, not the numeric id', function () {
    $user = User::factory()->create();
    $tax = Tax::factory()->create();

    $this->actingAs($user)
        ->get(route('taxes.show', $tax))
        ->assertOk();

    expect(route('taxes.show', $tax))->toContain($tax->uuid);
});

test('trashed taxes are not found', function () {
    $user = User::factory()->create();
    $tax = Tax::factory()->create();
    $tax->delete();

    $this->actingAs($user)
        ->get(route('taxes.show', $tax))
        ->assertNotFound();
});

test('guests cannot view a tax', function () {
    $tax = Tax::factory()->create();

    $this->get(route('taxes.show', $tax))
        ->assertRedirect(route('login'));
});
