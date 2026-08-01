<?php

use App\Models\Product;
use App\Models\Quotation;
use App\Models\User;
use Inertia\Testing\AssertableInertia as Assert;

test('bom create page is displayed for a draft quotation', function () {
    $user = User::factory()->create();
    $quotation = Quotation::factory()->create(['status' => 'draft']);

    $this->actingAs($user)
        ->get(route('quotations.bom.create', $quotation))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('boms/create'),
        );
});

test('bom create page is forbidden for a non-draft quotation', function () {
    $user = User::factory()->create();
    $quotation = Quotation::factory()->create(['status' => 'approved']);

    $this->actingAs($user)
        ->get(route('quotations.bom.create', $quotation))
        ->assertForbidden();
});

test('bom create page is forbidden when the quotation already has a bom', function () {
    $user = User::factory()->create();
    $quotation = Quotation::factory()->create(['status' => 'draft']);
    $quotation->bom()->create([]);

    $this->actingAs($user)
        ->get(route('quotations.bom.create', $quotation))
        ->assertStatus(409);
});

test('bom can be created with costs calculated', function () {
    $user = User::factory()->create();
    $quotation = Quotation::factory()->create(['status' => 'draft']);
    $product = Product::factory()->create(['cost' => 50_000]);

    $response = $this->actingAs($user)
        ->post(route('quotations.bom.store', $quotation), [
            'overhead_percentage' => 20,
            'selling_percentage' => 110,
            'items' => [
                [
                    'product_id' => $product->id,
                    'brand' => 'Schneider Electric',
                    'quantity' => 2,
                    'unit' => 'Pcs',
                    'unit_cost' => 50_000,
                ],
            ],
        ]);

    $response->assertSessionHasNoErrors();

    $bom = $quotation->bom()->sole();
    $response->assertRedirect(route('quotations.bom.show', $quotation));

    expect((float) $bom->main_cost)->toBe(100_000.0);
    expect((float) $bom->overhead_cost)->toBe(20_000.0);
    expect((float) $bom->total_cost)->toBe(120_000.0);
    expect((float) $bom->selling_cost)->toBe(132_000.0);

    $item = $bom->items()->sole();
    expect((float) $item->total_cost)->toBe(100_000.0);
    expect($item->brand)->toBe('Schneider Electric');
});

test('a bom line item can have a discount', function () {
    $user = User::factory()->create();
    $quotation = Quotation::factory()->create(['status' => 'draft']);
    $product = Product::factory()->create(['cost' => 100_000]);

    $this->actingAs($user)->post(route('quotations.bom.store', $quotation), [
        'items' => [
            [
                'product_id' => $product->id,
                'brand' => 'ABB',
                'quantity' => 1,
                'unit' => 'Pcs',
                'unit_cost' => 100_000,
                'discount_type' => 'percentage',
                'discount_value' => 90,
            ],
        ],
    ])->assertSessionHasNoErrors();

    $bom = $quotation->bom()->sole();
    expect((float) $bom->main_cost)->toBe(90_000.0);
    expect((float) $bom->overhead_cost)->toBe(0.0);
    expect((float) $bom->total_cost)->toBe(90_000.0);
    expect((float) $bom->selling_cost)->toBe(90_000.0);
});

test('bom cannot be stored for a non-draft quotation', function () {
    $user = User::factory()->create();
    $quotation = Quotation::factory()->create(['status' => 'approved']);
    $product = Product::factory()->create();

    $this->actingAs($user)
        ->post(route('quotations.bom.store', $quotation), [
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

test('bom cannot be stored when the quotation already has a bom', function () {
    $user = User::factory()->create();
    $quotation = Quotation::factory()->create(['status' => 'draft']);
    $quotation->bom()->create([]);
    $product = Product::factory()->create();

    $this->actingAs($user)
        ->post(route('quotations.bom.store', $quotation), [
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

test('bom materials can be grouped with a per-group subtotal', function () {
    $user = User::factory()->create();
    $quotation = Quotation::factory()->create(['status' => 'draft']);
    $groupedProduct = Product::factory()->create(['cost' => 40_000]);
    $ungroupedProduct = Product::factory()->create(['cost' => 20_000]);

    $response = $this->actingAs($user)
        ->post(route('quotations.bom.store', $quotation), [
            'items' => [
                [
                    'product_id' => $ungroupedProduct->id,
                    'brand' => 'ABB',
                    'quantity' => 1,
                    'unit' => 'Pcs',
                    'unit_cost' => 20_000,
                ],
            ],
            'groups' => [
                [
                    'name' => 'Control Panel',
                    'items' => [
                        [
                            'product_id' => $groupedProduct->id,
                            'brand' => 'Schneider Electric',
                            'quantity' => 2,
                            'unit' => 'Pcs',
                            'unit_cost' => 40_000,
                        ],
                    ],
                ],
            ],
        ]);

    $response->assertSessionHasNoErrors();

    $bom = $quotation->bom()->sole();
    expect((float) $bom->main_cost)->toBe(100_000.0);

    $group = $bom->groups()->sole();
    expect($group->name)->toBe('Control Panel');
    expect((float) $group->subtotal)->toBe(80_000.0);
    expect($group->items()->count())->toBe(1);
    expect($bom->items()->whereNull('bom_group_id')->count())->toBe(1);
});

test('a bom can have materials only inside a group, with no ungrouped items', function () {
    $user = User::factory()->create();
    $quotation = Quotation::factory()->create(['status' => 'draft']);
    $product = Product::factory()->create(['cost' => 10_000]);

    $this->actingAs($user)
        ->post(route('quotations.bom.store', $quotation), [
            'groups' => [
                [
                    'name' => 'Sensor Assembly',
                    'items' => [
                        [
                            'product_id' => $product->id,
                            'brand' => 'Siemens',
                            'quantity' => 1,
                            'unit' => 'Pcs',
                            'unit_cost' => 10_000,
                        ],
                    ],
                ],
            ],
        ])
        ->assertSessionHasNoErrors();

    $bom = $quotation->bom()->sole();
    expect($bom->items()->whereNull('bom_group_id')->count())->toBe(0);
    expect($bom->groups()->sole()->items()->count())->toBe(1);
});

test('a hardware group can have phase subgroups with their own subtotal', function () {
    $user = User::factory()->create();
    $quotation = Quotation::factory()->create(['status' => 'draft']);
    $directProduct = Product::factory()->create(['cost' => 10_000]);
    $phaseProduct = Product::factory()->create(['cost' => 20_000]);

    $response = $this->actingAs($user)
        ->post(route('quotations.bom.store', $quotation), [
            'groups' => [
                [
                    'name' => 'Control Panel',
                    'items' => [
                        [
                            'product_id' => $directProduct->id,
                            'brand' => 'ABB',
                            'quantity' => 1,
                            'unit' => 'Pcs',
                            'unit_cost' => 10_000,
                        ],
                    ],
                    'subgroups' => [
                        [
                            'name' => 'Q1',
                            'items' => [
                                [
                                    'product_id' => $phaseProduct->id,
                                    'brand' => 'Schneider Electric',
                                    'quantity' => 1,
                                    'unit' => 'Pcs',
                                    'unit_cost' => 20_000,
                                ],
                            ],
                        ],
                    ],
                ],
            ],
        ]);

    $response->assertSessionHasNoErrors();

    $bom = $quotation->bom()->sole();
    expect((float) $bom->main_cost)->toBe(30_000.0);

    $group = $bom->groups()->sole();
    expect((float) $group->subtotal)->toBe(30_000.0);
    expect($group->items()->count())->toBe(1);

    $subgroup = $group->subgroups()->sole();
    expect($subgroup->name)->toBe('Q1');
    expect((float) $subgroup->subtotal)->toBe(20_000.0);
    expect($subgroup->items()->count())->toBe(1);
});

test('bom materials can be organized into top-level phase subgroups without a hardware group', function () {
    $user = User::factory()->create();
    $quotation = Quotation::factory()->create(['status' => 'draft']);
    $product = Product::factory()->create(['cost' => 15_000]);

    $response = $this->actingAs($user)
        ->post(route('quotations.bom.store', $quotation), [
            'subgroups' => [
                [
                    'name' => 'Q2',
                    'items' => [
                        [
                            'product_id' => $product->id,
                            'brand' => 'Siemens',
                            'quantity' => 1,
                            'unit' => 'Pcs',
                            'unit_cost' => 15_000,
                        ],
                    ],
                ],
            ],
        ]);

    $response->assertSessionHasNoErrors();

    $bom = $quotation->bom()->sole();
    expect((float) $bom->main_cost)->toBe(15_000.0);

    $subgroup = $bom->subgroups()->sole();
    expect($subgroup->name)->toBe('Q2');
    expect($subgroup->bom_group_id)->toBeNull();
    expect((float) $subgroup->subtotal)->toBe(15_000.0);
});

test('a group with no direct materials and no subgroup materials is rejected', function () {
    $user = User::factory()->create();
    $quotation = Quotation::factory()->create(['status' => 'draft']);

    $this->actingAs($user)
        ->post(route('quotations.bom.store', $quotation), [
            'groups' => [
                ['name' => 'Empty Group'],
            ],
        ])
        ->assertSessionHasErrors('groups.0.items');
});

test('bom requires at least one item', function () {
    $user = User::factory()->create();
    $quotation = Quotation::factory()->create(['status' => 'draft']);

    $this->actingAs($user)
        ->post(route('quotations.bom.store', $quotation), ['items' => []])
        ->assertSessionHasErrors('items');
});

test('guests cannot view or store a bom', function () {
    $quotation = Quotation::factory()->create(['status' => 'draft']);

    $this->get(route('quotations.bom.create', $quotation))
        ->assertRedirect(route('login'));

    $this->post(route('quotations.bom.store', $quotation), [])
        ->assertRedirect(route('login'));
});
