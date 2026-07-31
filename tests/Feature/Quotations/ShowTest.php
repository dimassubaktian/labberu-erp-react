<?php

use App\Models\Quotation;
use App\Models\QuotationItem;
use App\Models\User;
use Inertia\Testing\AssertableInertia as Assert;

test('quotation detail page is displayed', function () {
    $user = User::factory()->create();
    $quotation = Quotation::factory()->create();
    QuotationItem::factory()->create(['quotation_id' => $quotation->id]);

    $this->actingAs($user)
        ->get(route('quotations.show', $quotation))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('quotations/show')
            ->where('quotation.uuid', $quotation->uuid)
            ->where('quotation.quotation_code', $quotation->quotation_code)
            ->has('quotation.items', 1),
        );
});

test('quotation detail page includes the full revision history for its thread', function () {
    $user = User::factory()->create();
    $root = Quotation::factory()->create(['version_major' => 1, 'version_minor' => 0, 'is_current' => false]);
    $revision = Quotation::factory()->create([
        'root_quotation_id' => $root->id,
        'version_major' => 1,
        'version_minor' => 1,
        'is_current' => true,
    ]);

    $this->actingAs($user)
        ->get(route('quotations.show', $revision))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('quotations/show')
            ->has('history', 2)
            ->where('history.0.id', $root->id)
            ->where('history.1.id', $revision->id),
        );
});

test('quotation detail page is resolved by uuid, not the numeric id', function () {
    $user = User::factory()->create();
    $quotation = Quotation::factory()->create();

    $this->actingAs($user)
        ->get(route('quotations.show', $quotation))
        ->assertOk();

    expect(route('quotations.show', $quotation))->toContain($quotation->uuid);
});

test('trashed quotations are not found', function () {
    $user = User::factory()->create();
    $quotation = Quotation::factory()->create();
    $quotation->delete();

    $this->actingAs($user)
        ->get(route('quotations.show', $quotation))
        ->assertNotFound();
});

test('guests cannot view a quotation', function () {
    $quotation = Quotation::factory()->create();

    $this->get(route('quotations.show', $quotation))
        ->assertRedirect(route('login'));
});
