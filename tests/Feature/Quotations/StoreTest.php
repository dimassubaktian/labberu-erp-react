<?php

use App\Models\Currency;
use App\Models\Product;
use App\Models\Project;
use App\Models\Quotation;
use App\Models\Tax;
use App\Models\User;
use Inertia\Testing\AssertableInertia as Assert;

test('quotation create page is displayed', function () {
    $user = User::factory()->create();

    $this->actingAs($user)
        ->get(route('quotations.create'))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('quotations/create')
            ->where('initialProject', null),
        );
});

test('quotation create page preselects the project given in the query string', function () {
    $user = User::factory()->create();
    $project = Project::factory()->create();

    $this->actingAs($user)
        ->get(route('quotations.create', ['project' => $project->uuid]))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('quotations/create')
            ->where('initialProject.id', $project->id),
        );
});

test('quotation can be created with totals calculated', function () {
    $user = User::factory()->create();
    $project = Project::factory()->create();
    $currency = Currency::factory()->create();
    $product = Product::factory()->create(['price' => 100_000, 'cost' => 60_000]);

    $response = $this->actingAs($user)
        ->post(route('quotations.store'), [
            'project_id' => $project->id,
            'currency_id' => $currency->id,
            'items' => [
                [
                    'product_id' => $product->id,
                    'quantity' => 2,
                    'unit' => 'Pcs',
                    'unit_price' => 100_000,
                    'unit_cost' => 60_000,
                ],
            ],
        ]);

    $response->assertSessionHasNoErrors();

    $quotation = Quotation::sole();
    $response->assertRedirect(route('quotations.show', $quotation));

    expect((float) $quotation->subtotal)->toBe(200_000.0);
    expect((float) $quotation->discount_amount)->toBe(0.0);
    expect((float) $quotation->tax_amount)->toBe(0.0);
    expect((float) $quotation->total)->toBe(200_000.0);
    expect($quotation->status)->toBe('draft');

    $item = $quotation->items()->sole();
    expect((float) $item->total_price)->toBe(200_000.0);
    expect((float) $item->total_cost)->toBe(120_000.0);
    expect((float) $item->margin)->toBe(80_000.0);
    expect((float) $item->margin_percent)->toBe(40.0);
});

test('a line item can override the product description', function () {
    $user = User::factory()->create();
    $project = Project::factory()->create();
    $currency = Currency::factory()->create();
    $product = Product::factory()->create(['price' => 100_000, 'cost' => 60_000, 'descriptions' => 'Default product description']);

    $this->actingAs($user)->post(route('quotations.store'), [
        'project_id' => $project->id,
        'currency_id' => $currency->id,
        'items' => [
            [
                'product_id' => $product->id,
                'description' => 'Custom wording for this quote',
                'quantity' => 1,
                'unit' => 'Pcs',
                'unit_price' => 100_000,
                'unit_cost' => 60_000,
            ],
        ],
    ])->assertSessionHasNoErrors();

    $item = Quotation::sole()->items()->sole();

    expect($item->description)->toBe('Custom wording for this quote');
});

test('a line item description is optional and defaults to null', function () {
    $user = User::factory()->create();
    $project = Project::factory()->create();
    $currency = Currency::factory()->create();
    $product = Product::factory()->create();

    $this->actingAs($user)->post(route('quotations.store'), [
        'project_id' => $project->id,
        'currency_id' => $currency->id,
        'items' => [
            ['product_id' => $product->id, 'quantity' => 1, 'unit' => 'Pcs', 'unit_price' => 1000, 'unit_cost' => 500],
        ],
    ])->assertSessionHasNoErrors();

    $item = Quotation::sole()->items()->sole();

    expect($item->description)->toBeNull();
});

test('quotation-level discount and percentage tax are applied to the total', function () {
    $user = User::factory()->create();
    $project = Project::factory()->create();
    $currency = Currency::factory()->create();
    $tax = Tax::factory()->percentage()->create(['rate' => 11]);
    $product = Product::factory()->create(['price' => 100_000, 'cost' => 60_000]);

    $this->actingAs($user)->post(route('quotations.store'), [
        'project_id' => $project->id,
        'currency_id' => $currency->id,
        'tax_id' => $tax->id,
        'discount_type' => 'percentage',
        'discount_value' => 10,
        'items' => [
            [
                'product_id' => $product->id,
                'quantity' => 2,
                'unit' => 'Pcs',
                'unit_price' => 100_000,
                'unit_cost' => 60_000,
            ],
        ],
    ]);

    $quotation = Quotation::sole();

    expect((float) $quotation->subtotal)->toBe(200_000.0);
    expect((float) $quotation->discount_amount)->toBe(20_000.0);
    expect((float) $quotation->tax_amount)->toBe(19_800.0);
    expect((float) $quotation->total)->toBe(199_800.0);
});

test('line item fixed discount reduces total price and margin', function () {
    $user = User::factory()->create();
    $project = Project::factory()->create();
    $currency = Currency::factory()->create();
    $product = Product::factory()->create(['price' => 100_000, 'cost' => 50_000]);

    $this->actingAs($user)->post(route('quotations.store'), [
        'project_id' => $project->id,
        'currency_id' => $currency->id,
        'items' => [
            [
                'product_id' => $product->id,
                'quantity' => 1,
                'unit' => 'Pcs',
                'unit_price' => 100_000,
                'unit_cost' => 50_000,
                'discount_type' => 'fixed',
                'discount_value' => 10_000,
            ],
        ],
    ]);

    $item = Quotation::sole()->items()->sole();

    expect((float) $item->total_price)->toBe(90_000.0);
    expect((float) $item->total_cost)->toBe(50_000.0);
    expect((float) $item->margin)->toBe(40_000.0);
    expect((float) $item->margin_percent)->toBe(44.44);
});

test('quotation code is derived from the project code and shared within its thread', function () {
    $user = User::factory()->create();
    $project = Project::factory()->create();
    $currency = Currency::factory()->create();
    $product = Product::factory()->create();

    $this->actingAs($user)->post(route('quotations.store'), [
        'project_id' => $project->id,
        'currency_id' => $currency->id,
        'items' => [
            ['product_id' => $product->id, 'quantity' => 1, 'unit' => 'Pcs', 'unit_price' => 1000, 'unit_cost' => 500],
        ],
    ]);

    $quotation = Quotation::sole();
    [$prefix, $sequence, $customerCode] = explode('-', $project->project_code);

    expect($quotation->quotation_code)->toBe(sprintf('%s-Q%s-01-%s', $prefix, $sequence, $customerCode));
    expect($quotation->version_major)->toBe(1);
    expect($quotation->version_minor)->toBe(0);
    expect($quotation->is_current)->toBeTrue();
});

test('groups compute their own subtotal, discount, and tax, which roll into the header total', function () {
    $user = User::factory()->create();
    $project = Project::factory()->create();
    $currency = Currency::factory()->create();
    $tax = Tax::factory()->percentage()->create(['rate' => 11]);
    $laborProduct = Product::factory()->create(['price' => 100_000, 'cost' => 50_000]);
    $materialsProduct = Product::factory()->create(['price' => 100_000, 'cost' => 50_000]);

    $response = $this->actingAs($user)->post(route('quotations.store'), [
        'project_id' => $project->id,
        'currency_id' => $currency->id,
        'discount_type' => 'fixed',
        'discount_value' => 100_000,
        'tax_id' => $tax->id,
        'groups' => [
            [
                'name' => 'Labor',
                'tax_id' => $tax->id,
                'items' => [
                    ['product_id' => $laborProduct->id, 'quantity' => 10, 'unit' => 'Pcs', 'unit_price' => 100_000, 'unit_cost' => 50_000],
                ],
            ],
            [
                'name' => 'Materials',
                'items' => [
                    ['product_id' => $materialsProduct->id, 'quantity' => 20, 'unit' => 'Pcs', 'unit_price' => 100_000, 'unit_cost' => 50_000],
                ],
            ],
        ],
    ]);

    $response->assertSessionHasNoErrors();

    $quotation = Quotation::sole();
    $labor = $quotation->groups()->where('name', 'Labor')->sole();
    $materials = $quotation->groups()->where('name', 'Materials')->sole();

    expect((float) $labor->subtotal)->toBe(1_000_000.0);
    expect((float) $labor->tax_amount)->toBe(110_000.0);
    expect((float) $labor->total)->toBe(1_110_000.0);
    expect($labor->items()->count())->toBe(1);

    expect((float) $materials->subtotal)->toBe(2_000_000.0);
    expect((float) $materials->tax_amount)->toBe(0.0);
    expect((float) $materials->total)->toBe(2_000_000.0);

    expect((float) $quotation->subtotal)->toBe(3_110_000.0);
    expect((float) $quotation->discount_amount)->toBe(100_000.0);
    expect((float) $quotation->tax_amount)->toBe(331_100.0);
    expect((float) $quotation->total)->toBe(3_341_100.0);
});

test('grouped and ungrouped items can both be present on the same quotation', function () {
    $user = User::factory()->create();
    $project = Project::factory()->create();
    $currency = Currency::factory()->create();
    $groupedProduct = Product::factory()->create(['price' => 50_000, 'cost' => 20_000]);
    $ungroupedProduct = Product::factory()->create(['price' => 30_000, 'cost' => 10_000]);

    $this->actingAs($user)->post(route('quotations.store'), [
        'project_id' => $project->id,
        'currency_id' => $currency->id,
        'items' => [
            ['product_id' => $ungroupedProduct->id, 'quantity' => 1, 'unit' => 'Pcs', 'unit_price' => 30_000, 'unit_cost' => 10_000],
        ],
        'groups' => [
            [
                'name' => 'Labor',
                'items' => [
                    ['product_id' => $groupedProduct->id, 'quantity' => 1, 'unit' => 'Pcs', 'unit_price' => 50_000, 'unit_cost' => 20_000],
                ],
            ],
        ],
    ])->assertSessionHasNoErrors();

    $quotation = Quotation::sole();

    expect($quotation->items()->whereNull('quotation_group_id')->count())->toBe(1);
    expect($quotation->groups()->sole()->items()->count())->toBe(1);
    expect((float) $quotation->subtotal)->toBe(80_000.0);
    expect((float) $quotation->total)->toBe(80_000.0);
});

test('a group requires a name and at least one item', function () {
    $user = User::factory()->create();
    $project = Project::factory()->create();
    $currency = Currency::factory()->create();

    $this->actingAs($user)
        ->post(route('quotations.store'), [
            'project_id' => $project->id,
            'currency_id' => $currency->id,
            'groups' => [
                ['items' => []],
            ],
        ])
        ->assertSessionHasErrors(['groups.0.name', 'groups.0.items']);
});

test('required fields are validated', function () {
    $user = User::factory()->create();

    $this->actingAs($user)
        ->post(route('quotations.store'), [])
        ->assertSessionHasErrors(['project_id', 'currency_id', 'items']);
});

test('at least one line item is required', function () {
    $user = User::factory()->create();
    $project = Project::factory()->create();
    $currency = Currency::factory()->create();

    $this->actingAs($user)
        ->post(route('quotations.store'), [
            'project_id' => $project->id,
            'currency_id' => $currency->id,
            'items' => [],
        ])
        ->assertSessionHasErrors(['items']);
});

test('guests cannot create quotations', function () {
    $this->get(route('quotations.create'))
        ->assertRedirect(route('login'));

    $this->post(route('quotations.store'), [])
        ->assertRedirect(route('login'));
});

test('quotation can be created with a BOM in one request', function () {
    $user = User::factory()->create();
    $project = Project::factory()->create();
    $currency = Currency::factory()->create();
    $product = Product::factory()->create(['price' => 100_000, 'cost' => 50_000]);
    $bomProduct = Product::factory()->create(['cost' => 30_000]);

    $response = $this->actingAs($user)
        ->post(route('quotations.store'), [
            'project_id' => $project->id,
            'currency_id' => $currency->id,
            'items' => [
                [
                    'product_id' => $product->id,
                    'quantity' => 1,
                    'unit' => 'Pcs',
                    'unit_price' => 100_000,
                    'unit_cost' => 50_000,
                ],
            ],
            'bom' => [
                'overhead_percentage' => 10,
                'items' => [
                    [
                        'product_id' => $bomProduct->id,
                        'brand' => 'Acme',
                        'quantity' => 2,
                        'unit' => 'Pcs',
                        'unit_cost' => 30_000,
                    ],
                ],
            ],
        ]);

    $response->assertSessionHasNoErrors();

    $quotation = Quotation::sole();
    expect($quotation->bom)->not->toBeNull();

    $bom = $quotation->bom;
    expect((float) $bom->main_cost)->toBe(60_000.0);
    expect((float) $bom->overhead_cost)->toBe(6_000.0);
    expect((float) $bom->total_cost)->toBe(66_000.0);
    expect($bom->items()->count())->toBe(1);
});

test('quotation is created without BOM when no BOM items are submitted', function () {
    $user = User::factory()->create();
    $project = Project::factory()->create();
    $currency = Currency::factory()->create();
    $product = Product::factory()->create(['price' => 100_000, 'cost' => 50_000]);

    $this->actingAs($user)
        ->post(route('quotations.store'), [
            'project_id' => $project->id,
            'currency_id' => $currency->id,
            'items' => [
                [
                    'product_id' => $product->id,
                    'quantity' => 1,
                    'unit' => 'Pcs',
                    'unit_price' => 100_000,
                    'unit_cost' => 50_000,
                ],
            ],
            'bom' => [
                'overhead_percentage' => 10,
            ],
        ])
        ->assertSessionHasNoErrors();

    $quotation = Quotation::sole();
    expect($quotation->bom)->toBeNull();
});
