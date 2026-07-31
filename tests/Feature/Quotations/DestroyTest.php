<?php

use App\Models\Quotation;
use App\Models\User;

test('a draft quotation without revisions can be deleted', function () {
    $user = User::factory()->create();
    $quotation = Quotation::factory()->create(['status' => 'draft']);

    $response = $this->actingAs($user)->delete(route('quotations.destroy', $quotation));

    $response->assertRedirect(route('quotations.index'));
    expect(Quotation::withTrashed()->find($quotation->id)->trashed())->toBeTrue();
});

test('a non-draft quotation cannot be deleted', function () {
    $user = User::factory()->create();
    $quotation = Quotation::factory()->create(['status' => 'approved']);

    $this->actingAs($user)
        ->delete(route('quotations.destroy', $quotation))
        ->assertForbidden();

    expect(Quotation::find($quotation->id))->not->toBeNull();
});

test('a root quotation with a revision cannot be deleted', function () {
    $user = User::factory()->create();
    $root = Quotation::factory()->create(['status' => 'draft']);
    Quotation::factory()->create(['root_quotation_id' => $root->id, 'status' => 'draft', 'version_minor' => 1]);

    $this->actingAs($user)
        ->delete(route('quotations.destroy', $root))
        ->assertStatus(422);

    expect(Quotation::find($root->id))->not->toBeNull();
});

test('a revision quotation cannot be deleted while its root still exists', function () {
    $user = User::factory()->create();
    $root = Quotation::factory()->create();
    $revision = Quotation::factory()->create(['root_quotation_id' => $root->id, 'status' => 'draft', 'version_minor' => 1]);

    $this->actingAs($user)
        ->delete(route('quotations.destroy', $revision))
        ->assertStatus(422);

    expect(Quotation::find($revision->id))->not->toBeNull();
});

test('guests cannot delete quotations', function () {
    $quotation = Quotation::factory()->create(['status' => 'draft']);

    $this->delete(route('quotations.destroy', $quotation))
        ->assertRedirect(route('login'));
});
