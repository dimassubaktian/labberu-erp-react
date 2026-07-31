<?php

use App\Models\Quotation;
use App\Models\QuotationItem;
use App\Models\User;

test('a major revision bumps the major version and resets minor to zero', function () {
    $user = User::factory()->create();
    $quotation = Quotation::factory()->create([
        'status' => 'approved',
        'version_major' => 1,
        'version_minor' => 3,
        'is_current' => true,
    ]);
    QuotationItem::factory()->create(['quotation_id' => $quotation->id]);

    $response = $this->actingAs($user)
        ->post(route('quotations.revisions.store', $quotation), [
            'version_type' => 'major',
        ]);

    $response->assertSessionHasNoErrors();

    $quotation->refresh();
    expect($quotation->is_current)->toBeFalse();

    $revision = Quotation::where('id', '!=', $quotation->id)->sole();

    $response->assertRedirect(route('quotations.edit', $revision));
    expect($revision->version_major)->toBe(2);
    expect($revision->version_minor)->toBe(0);
    expect($revision->status)->toBe('draft');
    expect($revision->is_current)->toBeTrue();
    expect($revision->root_quotation_id)->toBe($quotation->id);
    expect($revision->quotation_code)->toBe($quotation->quotation_code);
    expect($revision->items()->count())->toBe(1);
});

test('a minor revision bumps only the minor version', function () {
    $user = User::factory()->create();
    $quotation = Quotation::factory()->create([
        'status' => 'approved',
        'version_major' => 1,
        'version_minor' => 2,
    ]);

    $this->actingAs($user)->post(route('quotations.revisions.store', $quotation), [
        'version_type' => 'minor',
    ]);

    $revision = Quotation::where('id', '!=', $quotation->id)->sole();

    expect($revision->version_major)->toBe(1);
    expect($revision->version_minor)->toBe(3);
});

test('a second revision inherits the original root, not the previous revision', function () {
    $user = User::factory()->create();
    $root = Quotation::factory()->create(['status' => 'approved']);

    $this->actingAs($user)->post(route('quotations.revisions.store', $root), [
        'version_type' => 'minor',
    ]);

    $firstRevision = Quotation::where('id', '!=', $root->id)->sole();
    $firstRevision->update(['status' => 'approved']);

    $this->actingAs($user)->post(route('quotations.revisions.store', $firstRevision), [
        'version_type' => 'minor',
    ]);

    $secondRevision = Quotation::whereNotIn('id', [$root->id, $firstRevision->id])->sole();

    expect($secondRevision->root_quotation_id)->toBe($root->id);
    expect($firstRevision->refresh()->is_current)->toBeFalse();
    expect($secondRevision->is_current)->toBeTrue();
});

test('a non-current quotation cannot be revised', function () {
    $user = User::factory()->create();
    $root = Quotation::factory()->create(['status' => 'approved']);

    $this->actingAs($user)->post(route('quotations.revisions.store', $root), [
        'version_type' => 'minor',
    ]);

    $root->refresh();
    expect($root->is_current)->toBeFalse();

    $this->actingAs($user)
        ->post(route('quotations.revisions.store', $root), ['version_type' => 'minor'])
        ->assertForbidden();

    expect(Quotation::where('root_quotation_id', $root->id)->count())->toBe(1);
});

test('a draft quotation cannot be revised', function () {
    $user = User::factory()->create();
    $quotation = Quotation::factory()->create(['status' => 'draft']);

    $this->actingAs($user)
        ->post(route('quotations.revisions.store', $quotation), ['version_type' => 'minor'])
        ->assertForbidden();
});

test('version type is validated', function () {
    $user = User::factory()->create();
    $quotation = Quotation::factory()->create(['status' => 'approved']);

    $this->actingAs($user)
        ->post(route('quotations.revisions.store', $quotation), ['version_type' => 'invalid'])
        ->assertSessionHasErrors(['version_type']);
});

test('guests cannot create revisions', function () {
    $quotation = Quotation::factory()->create(['status' => 'approved']);

    $this->post(route('quotations.revisions.store', $quotation), ['version_type' => 'minor'])
        ->assertRedirect(route('login'));
});
