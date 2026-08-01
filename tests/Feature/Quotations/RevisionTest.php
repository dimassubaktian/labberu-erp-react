<?php

use App\Models\Product;
use App\Models\Quotation;
use App\Models\QuotationGroup;
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

test('revising a quotation copies its groups and their items', function () {
    $user = User::factory()->create();
    $quotation = Quotation::factory()->create(['status' => 'approved']);
    $group = QuotationGroup::factory()->create([
        'quotation_id' => $quotation->id,
        'name' => 'Labor',
        'subtotal' => 100_000,
        'total' => 100_000,
    ]);
    QuotationItem::factory()->create(['quotation_id' => $quotation->id, 'quotation_group_id' => $group->id]);
    QuotationItem::factory()->create(['quotation_id' => $quotation->id]);

    $this->actingAs($user)
        ->post(route('quotations.revisions.store', $quotation), ['version_type' => 'minor'])
        ->assertSessionHasNoErrors();

    $revision = Quotation::where('id', '!=', $quotation->id)->sole();

    $revisedGroup = $revision->groups()->sole();
    expect($revisedGroup->name)->toBe('Labor');
    expect((float) $revisedGroup->total)->toBe(100_000.0);
    expect($revisedGroup->items()->count())->toBe(1);
    expect($revision->items()->whereNull('quotation_group_id')->count())->toBe(1);
});

test('revising a quotation copies its bom, including groups and their items', function () {
    $user = User::factory()->create();
    $quotation = Quotation::factory()->create(['status' => 'approved']);
    $bom = $quotation->bom()->create([
        'main_cost' => 150_000,
        'total_cost' => 150_000,
        'selling_cost' => 150_000,
    ]);
    $group = $bom->groups()->create(['name' => 'Control Panel', 'subtotal' => 100_000]);
    $group->items()->create([
        'bom_id' => $bom->id,
        'product_id' => Product::factory()->create()->id,
        'brand' => 'ABB',
        'quantity' => 1,
        'unit' => 'Pcs',
        'unit_cost' => 100_000,
        'total_cost' => 100_000,
    ]);
    $bom->items()->create([
        'product_id' => Product::factory()->create()->id,
        'brand' => 'Schneider Electric',
        'quantity' => 1,
        'unit' => 'Pcs',
        'unit_cost' => 50_000,
        'total_cost' => 50_000,
    ]);

    $this->actingAs($user)
        ->post(route('quotations.revisions.store', $quotation), ['version_type' => 'minor'])
        ->assertSessionHasNoErrors();

    $revision = Quotation::where('id', '!=', $quotation->id)->sole();
    $revisedBom = $revision->bom()->sole();

    expect((float) $revisedBom->main_cost)->toBe(150_000.0);

    $revisedGroup = $revisedBom->groups()->sole();
    expect($revisedGroup->name)->toBe('Control Panel');
    expect((float) $revisedGroup->subtotal)->toBe(100_000.0);
    expect($revisedGroup->items()->count())->toBe(1);
    expect($revisedBom->items()->whereNull('bom_group_id')->count())->toBe(1);
});

test('revising a quotation copies its bom phase subgroups, nested and top-level', function () {
    $user = User::factory()->create();
    $quotation = Quotation::factory()->create(['status' => 'approved']);
    $bom = $quotation->bom()->create([
        'main_cost' => 60_000,
        'total_cost' => 60_000,
        'selling_cost' => 60_000,
    ]);

    $group = $bom->groups()->create(['name' => 'Control Panel', 'subtotal' => 20_000]);
    $nestedSubgroup = $bom->subgroups()->create([
        'bom_group_id' => $group->id,
        'name' => 'Q1',
        'subtotal' => 20_000,
    ]);
    $nestedSubgroup->items()->create([
        'bom_id' => $bom->id,
        'product_id' => Product::factory()->create()->id,
        'brand' => 'ABB',
        'quantity' => 1,
        'unit' => 'Pcs',
        'unit_cost' => 20_000,
        'total_cost' => 20_000,
    ]);

    $topSubgroup = $bom->subgroups()->create([
        'bom_group_id' => null,
        'name' => 'Q2',
        'subtotal' => 40_000,
    ]);
    $topSubgroup->items()->create([
        'bom_id' => $bom->id,
        'product_id' => Product::factory()->create()->id,
        'brand' => 'Siemens',
        'quantity' => 1,
        'unit' => 'Pcs',
        'unit_cost' => 40_000,
        'total_cost' => 40_000,
    ]);

    $this->actingAs($user)
        ->post(route('quotations.revisions.store', $quotation), ['version_type' => 'minor'])
        ->assertSessionHasNoErrors();

    $revision = Quotation::where('id', '!=', $quotation->id)->sole();
    $revisedBom = $revision->bom()->sole();

    $revisedGroup = $revisedBom->groups()->sole();
    $revisedNestedSubgroup = $revisedGroup->subgroups()->sole();
    expect($revisedNestedSubgroup->name)->toBe('Q1');
    expect((float) $revisedNestedSubgroup->subtotal)->toBe(20_000.0);
    expect($revisedNestedSubgroup->items()->count())->toBe(1);

    $revisedTopSubgroup = $revisedBom->subgroups()->sole();
    expect($revisedTopSubgroup->name)->toBe('Q2');
    expect($revisedTopSubgroup->bom_group_id)->toBeNull();
    expect((float) $revisedTopSubgroup->subtotal)->toBe(40_000.0);
    expect($revisedTopSubgroup->items()->count())->toBe(1);
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
