<?php

use App\Models\Product;
use App\Models\Quotation;
use App\Models\User;

test('bom print streams pdf inline by default', function () {
    $user = User::factory()->create();
    $quotation = Quotation::factory()->create();
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

    $response = $this->actingAs($user)
        ->get(route('quotations.bom.print', $quotation));

    $response->assertOk();
    $response->assertHeader('Content-Type', 'application/pdf');
    expect($response->headers->get('Content-Disposition'))->toContain('inline');
});

test('bom print forces download when download param is true', function () {
    $user = User::factory()->create();
    $quotation = Quotation::factory()->create();
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

    $response = $this->actingAs($user)
        ->get(route('quotations.bom.print', [$quotation, 'download' => 'true']));

    $response->assertOk();
    $response->assertHeader('Content-Type', 'application/pdf');
    expect($response->headers->get('Content-Disposition'))->toContain('attachment');
    expect($response->headers->get('Content-Disposition'))->toContain("bom-{$quotation->quotation_code}.pdf");
});

test('bom print requires authentication', function () {
    $quotation = Quotation::factory()->create();
    $quotation->bom()->create([]);

    $this->get(route('quotations.bom.print', $quotation))
        ->assertRedirect(route('login'));
});

test('bom print returns not found when the quotation has no bom', function () {
    $user = User::factory()->create();
    $quotation = Quotation::factory()->create();

    $this->actingAs($user)
        ->get(route('quotations.bom.print', $quotation))
        ->assertNotFound();
});

test('bom print accepts a partial group and subgroup selection', function () {
    $user = User::factory()->create();
    $quotation = Quotation::factory()->create();
    $product = Product::factory()->create();

    $bom = $quotation->bom()->create([]);
    $groupA = $bom->groups()->create(['name' => 'Group A', 'subtotal' => 10_000]);
    $groupA->items()->create([
        'bom_id' => $bom->id,
        'product_id' => $product->id,
        'brand' => 'ABB',
        'quantity' => 1,
        'unit' => 'Pcs',
        'unit_cost' => 10_000,
        'total_cost' => 10_000,
    ]);
    $groupB = $bom->groups()->create(['name' => 'Group B', 'subtotal' => 5_000]);
    $topSubgroup = $bom->subgroups()->create(['name' => 'Q1', 'subtotal' => 3_000]);
    $bom->items()->create([
        'product_id' => $product->id,
        'brand' => 'ABB',
        'quantity' => 1,
        'unit' => 'Pcs',
        'unit_cost' => 2_000,
        'total_cost' => 2_000,
    ]);

    $response = $this->actingAs($user)
        ->get(route('quotations.bom.print', [
            $quotation,
            'group_ids' => [$groupA->id],
            'subgroup_ids' => [$topSubgroup->id],
            'include_ungrouped' => '0',
        ]));

    $response->assertOk();
    $response->assertHeader('Content-Type', 'application/pdf');
});

test('bom print handles an empty selection without erroring', function () {
    $user = User::factory()->create();
    $quotation = Quotation::factory()->create();
    $product = Product::factory()->create();

    $bom = $quotation->bom()->create([]);
    $group = $bom->groups()->create(['name' => 'Group A', 'subtotal' => 10_000]);
    $group->items()->create([
        'bom_id' => $bom->id,
        'product_id' => $product->id,
        'brand' => 'ABB',
        'quantity' => 1,
        'unit' => 'Pcs',
        'unit_cost' => 10_000,
        'total_cost' => 10_000,
    ]);

    $response = $this->actingAs($user)
        ->get(route('quotations.bom.print', [$quotation, 'group_ids' => [], 'include_ungrouped' => '0']));

    $response->assertOk();
    $response->assertHeader('Content-Type', 'application/pdf');
});
