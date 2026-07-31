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
            ->component('quotations/create'),
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
