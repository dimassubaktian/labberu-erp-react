<?php

use App\Models\Product;
use App\Models\Quotation;
use App\Models\User;
use Inertia\Testing\AssertableInertia as Assert;

test('bom show page is displayed', function () {
    $user = User::factory()->create();
    $quotation = Quotation::factory()->create(['status' => 'draft']);
    $product = Product::factory()->create();

    $bom = $quotation->bom()->create([
        'remarks' => 'Handle with care',
        'main_cost' => 100_000,
        'overhead_percentage' => 20,
        'overhead_cost' => 20_000,
        'total_cost' => 120_000,
        'selling_percentage' => 110,
        'selling_cost' => 132_000,
    ]);

    $bom->items()->create([
        'product_id' => $product->id,
        'brand' => 'ABB',
        'quantity' => 2,
        'unit' => 'Pcs',
        'unit_cost' => 50_000,
        'total_cost' => 100_000,
    ]);

    $this->actingAs($user)
        ->get(route('quotations.bom.show', $quotation))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('boms/show')
            ->where('bom.main_cost', '100000.00')
            ->where('bom.total_cost', '120000.00')
            ->where('bom.selling_cost', '132000.00')
            ->has('bom.items', 1),
        );
});

test('bom show page is not found when the quotation has no bom', function () {
    $user = User::factory()->create();
    $quotation = Quotation::factory()->create(['status' => 'draft']);

    $this->actingAs($user)
        ->get(route('quotations.bom.show', $quotation))
        ->assertNotFound();
});

test('guests cannot view a bom', function () {
    $quotation = Quotation::factory()->create(['status' => 'draft']);

    $this->get(route('quotations.bom.show', $quotation))
        ->assertRedirect(route('login'));
});
