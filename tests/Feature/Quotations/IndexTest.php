<?php

use App\Models\Quotation;
use App\Models\User;
use Inertia\Testing\AssertableInertia as Assert;

test('quotations index page is displayed', function () {
    $user = User::factory()->create();
    Quotation::factory()->create();
    Quotation::factory()->create();

    $this->actingAs($user)
        ->get(route('quotations.index'))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('quotations/index')
            ->has('quotations.data', 2),
        );
});

test('only the current version of each quotation thread is listed', function () {
    $user = User::factory()->create();
    $root = Quotation::factory()->create(['is_current' => false]);
    Quotation::factory()->create([
        'project_id' => $root->project_id,
        'root_quotation_id' => $root->id,
        'version_minor' => 1,
        'is_current' => true,
    ]);

    $this->actingAs($user)
        ->get(route('quotations.index'))
        ->assertInertia(fn (Assert $page) => $page
            ->has('quotations.data', 1),
        );
});

test('trashed quotations are not listed', function () {
    $user = User::factory()->create();
    Quotation::factory()->create();
    Quotation::factory()->create()->delete();

    $this->actingAs($user)
        ->get(route('quotations.index'))
        ->assertInertia(fn (Assert $page) => $page
            ->has('quotations.data', 1),
        );
});

test('guests cannot view quotations', function () {
    $this->get(route('quotations.index'))
        ->assertRedirect(route('login'));
});
