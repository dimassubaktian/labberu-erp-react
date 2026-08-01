<?php

use App\Models\Product;
use App\Models\Quotation;
use App\Models\User;
use Inertia\Testing\AssertableInertia as Assert;

test('bom edit page is displayed for a draft quotation', function () {
    $user = User::factory()->create();
    $quotation = Quotation::factory()->create(['status' => 'draft']);
    $product = Product::factory()->create();

    $bom = $quotation->bom()->create([]);
    $bom->items()->create([
        'product_id' => $product->id,
        'brand' => 'ABB',
        'quantity' => 1,
        'unit' => 'Pcs',
        'unit_cost' => 10_000,
        'total_cost' => 10_000,
    ]);

    $this->actingAs($user)
        ->get(route('quotations.bom.edit', $quotation))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('boms/edit')
            ->has('bom.items', 1),
        );
});

test('bom edit page is forbidden for a non-draft quotation', function () {
    $user = User::factory()->create();
    $quotation = Quotation::factory()->create(['status' => 'approved']);
    $quotation->bom()->create([]);

    $this->actingAs($user)
        ->get(route('quotations.bom.edit', $quotation))
        ->assertForbidden();
});

test('bom can be updated with costs recalculated', function () {
    $user = User::factory()->create();
    $quotation = Quotation::factory()->create(['status' => 'draft']);
    $productOne = Product::factory()->create(['cost' => 50_000]);
    $productTwo = Product::factory()->create(['cost' => 30_000]);

    $bom = $quotation->bom()->create([
        'main_cost' => 50_000,
        'total_cost' => 50_000,
        'selling_cost' => 50_000,
    ]);
    $bom->items()->create([
        'product_id' => $productOne->id,
        'brand' => 'ABB',
        'quantity' => 1,
        'unit' => 'Pcs',
        'unit_cost' => 50_000,
        'total_cost' => 50_000,
    ]);

    $response = $this->actingAs($user)
        ->put(route('quotations.bom.update', $quotation), [
            'overhead_percentage' => 10,
            'selling_percentage' => 120,
            'items' => [
                [
                    'product_id' => $productTwo->id,
                    'brand' => 'Siemens',
                    'quantity' => 3,
                    'unit' => 'Pcs',
                    'unit_cost' => 30_000,
                ],
            ],
        ]);

    $response->assertSessionHasNoErrors();
    $response->assertRedirect(route('quotations.bom.show', $quotation));

    $bom->refresh();
    expect((float) $bom->main_cost)->toBe(90_000.0);
    expect((float) $bom->overhead_cost)->toBe(9_000.0);
    expect((float) $bom->total_cost)->toBe(99_000.0);
    expect((float) $bom->selling_cost)->toBe(118_800.0);

    $item = $bom->items()->sole();
    expect($item->product_id)->toBe($productTwo->id);
    expect($item->brand)->toBe('Siemens');
});

test('bom groups are replaced with a new per-group subtotal on update', function () {
    $user = User::factory()->create();
    $quotation = Quotation::factory()->create(['status' => 'draft']);
    $oldProduct = Product::factory()->create(['cost' => 10_000]);
    $newProduct = Product::factory()->create(['cost' => 25_000]);

    $bom = $quotation->bom()->create([]);
    $oldGroup = $bom->groups()->create(['name' => 'Old Group', 'subtotal' => 10_000]);
    $oldGroup->items()->create([
        'bom_id' => $bom->id,
        'product_id' => $oldProduct->id,
        'brand' => 'ABB',
        'quantity' => 1,
        'unit' => 'Pcs',
        'unit_cost' => 10_000,
        'total_cost' => 10_000,
    ]);

    $response = $this->actingAs($user)
        ->put(route('quotations.bom.update', $quotation), [
            'groups' => [
                [
                    'name' => 'Control Panel',
                    'items' => [
                        [
                            'product_id' => $newProduct->id,
                            'brand' => 'Schneider Electric',
                            'quantity' => 2,
                            'unit' => 'Pcs',
                            'unit_cost' => 25_000,
                        ],
                    ],
                ],
            ],
        ]);

    $response->assertSessionHasNoErrors();

    $bom->refresh();
    $group = $bom->groups()->sole();
    expect($group->name)->toBe('Control Panel');
    expect((float) $group->subtotal)->toBe(50_000.0);
    expect((float) $bom->main_cost)->toBe(50_000.0);
});

test('bom phase subgroups are replaced on update, both nested and top-level', function () {
    $user = User::factory()->create();
    $quotation = Quotation::factory()->create(['status' => 'draft']);
    $oldProduct = Product::factory()->create(['cost' => 10_000]);
    $groupPhaseProduct = Product::factory()->create(['cost' => 15_000]);
    $topPhaseProduct = Product::factory()->create(['cost' => 25_000]);

    $bom = $quotation->bom()->create([]);
    $oldGroup = $bom->groups()->create(['name' => 'Old Group', 'subtotal' => 10_000]);
    $oldSubgroup = $bom->subgroups()->create(['bom_group_id' => $oldGroup->id, 'name' => 'Old Phase', 'subtotal' => 10_000]);
    $oldSubgroup->items()->create([
        'bom_id' => $bom->id,
        'product_id' => $oldProduct->id,
        'brand' => 'ABB',
        'quantity' => 1,
        'unit' => 'Pcs',
        'unit_cost' => 10_000,
        'total_cost' => 10_000,
    ]);

    $response = $this->actingAs($user)
        ->put(route('quotations.bom.update', $quotation), [
            'subgroups' => [
                [
                    'name' => 'Q2',
                    'items' => [
                        [
                            'product_id' => $topPhaseProduct->id,
                            'brand' => 'Siemens',
                            'quantity' => 1,
                            'unit' => 'Pcs',
                            'unit_cost' => 25_000,
                        ],
                    ],
                ],
            ],
            'groups' => [
                [
                    'name' => 'Control Panel',
                    'subgroups' => [
                        [
                            'name' => 'Q1',
                            'items' => [
                                [
                                    'product_id' => $groupPhaseProduct->id,
                                    'brand' => 'Schneider Electric',
                                    'quantity' => 1,
                                    'unit' => 'Pcs',
                                    'unit_cost' => 15_000,
                                ],
                            ],
                        ],
                    ],
                ],
            ],
        ]);

    $response->assertSessionHasNoErrors();

    $bom->refresh();
    expect((float) $bom->main_cost)->toBe(40_000.0);

    $group = $bom->groups()->sole();
    expect($group->name)->toBe('Control Panel');
    expect((float) $group->subtotal)->toBe(15_000.0);

    $groupSubgroup = $group->subgroups()->sole();
    expect($groupSubgroup->name)->toBe('Q1');
    expect((float) $groupSubgroup->subtotal)->toBe(15_000.0);

    $topSubgroup = $bom->subgroups()->sole();
    expect($topSubgroup->name)->toBe('Q2');
    expect($topSubgroup->bom_group_id)->toBeNull();
    expect((float) $topSubgroup->subtotal)->toBe(25_000.0);
});

test('bom cannot be updated for a non-draft quotation', function () {
    $user = User::factory()->create();
    $quotation = Quotation::factory()->create(['status' => 'approved']);
    $product = Product::factory()->create();
    $quotation->bom()->create([]);

    $this->actingAs($user)
        ->put(route('quotations.bom.update', $quotation), [
            'items' => [
                [
                    'product_id' => $product->id,
                    'brand' => 'ABB',
                    'quantity' => 1,
                    'unit' => 'Pcs',
                    'unit_cost' => 10_000,
                ],
            ],
        ])
        ->assertForbidden();
});

test('bom cannot be updated when the quotation has no bom', function () {
    $user = User::factory()->create();
    $quotation = Quotation::factory()->create(['status' => 'draft']);
    $product = Product::factory()->create();

    $this->actingAs($user)
        ->put(route('quotations.bom.update', $quotation), [
            'items' => [
                [
                    'product_id' => $product->id,
                    'brand' => 'ABB',
                    'quantity' => 1,
                    'unit' => 'Pcs',
                    'unit_cost' => 10_000,
                ],
            ],
        ])
        ->assertForbidden();
});

test('guests cannot view or update a bom edit form', function () {
    $quotation = Quotation::factory()->create(['status' => 'draft']);
    $quotation->bom()->create([]);

    $this->get(route('quotations.bom.edit', $quotation))
        ->assertRedirect(route('login'));

    $this->put(route('quotations.bom.update', $quotation), [])
        ->assertRedirect(route('login'));
});
