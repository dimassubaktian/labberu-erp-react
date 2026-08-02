<?php

use App\Models\Bom;
use App\Models\Quotation;
use App\Models\User;

test('bom can be deleted from a draft quotation', function () {
    $user = User::factory()->create();
    $quotation = Quotation::factory()->create(['status' => 'draft']);
    $bom = $quotation->bom()->create([]);

    $response = $this->actingAs($user)->delete(route('quotations.bom.destroy', $quotation));

    $response->assertRedirect(route('quotations.show', $quotation));
    expect(Bom::find($bom->id))->toBeNull();
    expect($quotation->bom()->exists())->toBeFalse();
});

test('bom cannot be deleted from a non-draft quotation', function () {
    $user = User::factory()->create();
    $quotation = Quotation::factory()->create(['status' => 'approved']);
    $bom = $quotation->bom()->create([]);

    $this->actingAs($user)
        ->delete(route('quotations.bom.destroy', $quotation))
        ->assertForbidden();

    expect(Bom::find($bom->id))->not->toBeNull();
});

test('deleting a bom that does not exist 404s', function () {
    $user = User::factory()->create();
    $quotation = Quotation::factory()->create(['status' => 'draft']);

    $this->actingAs($user)
        ->delete(route('quotations.bom.destroy', $quotation))
        ->assertNotFound();
});

test('guests cannot delete a bom', function () {
    $quotation = Quotation::factory()->create(['status' => 'draft']);
    $quotation->bom()->create([]);

    $this->delete(route('quotations.bom.destroy', $quotation))
        ->assertRedirect(route('login'));
});
