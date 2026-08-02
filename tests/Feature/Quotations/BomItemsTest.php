<?php

use App\Models\Bom;
use App\Models\BomItem;
use App\Models\Product;
use App\Models\PurchaseOrder;
use App\Models\Quotation;
use App\Models\User;

function createBomItem(Bom $bom, array $overrides = []): BomItem
{
    return $bom->items()->create(array_merge([
        'product_id' => Product::factory()->create()->id,
        'brand' => 'ABB',
        'quantity' => 10,
        'unit' => 'Pcs',
        'unit_cost' => 1_000,
        'total_cost' => 10_000,
    ], $overrides));
}

test('an empty list is returned when the quotation has no bom', function () {
    $user = User::factory()->create();
    $quotation = Quotation::factory()->create();

    $this->actingAs($user)
        ->getJson(route('quotations.bom-items.index', $quotation))
        ->assertOk()
        ->assertJsonCount(0, 'data');
});

test('bom items are flattened across groups, subgroups, and ungrouped', function () {
    $user = User::factory()->create();
    $quotation = Quotation::factory()->create();
    $bom = $quotation->bom()->create([]);

    $group = $bom->groups()->create(['name' => 'Control Panel', 'sort_order' => 0, 'subtotal' => 0]);
    $subgroup = $bom->subgroups()->create(['bom_group_id' => $group->id, 'name' => 'Q1', 'sort_order' => 0, 'subtotal' => 0]);
    $topLevelSubgroup = $bom->subgroups()->create(['name' => 'Q2', 'sort_order' => 1, 'subtotal' => 0]);

    createBomItem($bom, ['bom_group_id' => $group->id]);
    createBomItem($bom, ['bom_subgroup_id' => $subgroup->id]);
    createBomItem($bom, ['bom_subgroup_id' => $topLevelSubgroup->id]);
    createBomItem($bom);

    $response = $this->actingAs($user)
        ->getJson(route('quotations.bom-items.index', $quotation))
        ->assertOk()
        ->assertJsonCount(4, 'data');

    $locations = collect($response->json('data'))
        ->map(fn (array $row) => [$row['group_name'], $row['subgroup_name']])
        ->all();

    expect($locations)->toContain(['Control Panel', null]);
    expect($locations)->toContain(['Control Panel', 'Q1']);
    expect($locations)->toContain([null, 'Q2']);
    expect($locations)->toContain([null, null]);
});

test('remaining quantity subtracts what has already been imported into other purchase orders', function () {
    $user = User::factory()->create();
    $quotation = Quotation::factory()->create();
    $bom = $quotation->bom()->create([]);
    $item = createBomItem($bom, ['quantity' => 10]);

    $purchaseOrder = PurchaseOrder::factory()->create(['quotation_id' => $quotation->id, 'status' => 'issued']);
    $purchaseOrder->items()->create([
        'product_id' => $item->product_id,
        'bom_item_id' => $item->id,
        'quantity' => 4,
        'unit' => 'Pcs',
        'unit_price' => 1_000,
        'total' => 4_000,
    ]);

    $response = $this->actingAs($user)
        ->getJson(route('quotations.bom-items.index', $quotation))
        ->assertOk();

    expect((float) $response->json('data.0.imported'))->toBe(4.0);
    expect((float) $response->json('data.0.remaining'))->toBe(6.0);
});

test('imported quantity excludes cancelled and voided purchase orders', function () {
    $user = User::factory()->create();
    $quotation = Quotation::factory()->create();
    $bom = $quotation->bom()->create([]);
    $item = createBomItem($bom, ['quantity' => 10]);

    $cancelled = PurchaseOrder::factory()->create(['quotation_id' => $quotation->id, 'status' => 'cancelled']);
    $cancelled->items()->create([
        'product_id' => $item->product_id,
        'bom_item_id' => $item->id,
        'quantity' => 3,
        'unit' => 'Pcs',
        'unit_price' => 1_000,
        'total' => 3_000,
    ]);

    $voided = PurchaseOrder::factory()->create(['quotation_id' => $quotation->id, 'status' => 'voided']);
    $voided->items()->create([
        'product_id' => $item->product_id,
        'bom_item_id' => $item->id,
        'quantity' => 3,
        'unit' => 'Pcs',
        'unit_price' => 1_000,
        'total' => 3_000,
    ]);

    $response = $this->actingAs($user)
        ->getJson(route('quotations.bom-items.index', $quotation))
        ->assertOk();

    expect((float) $response->json('data.0.imported'))->toBe(0.0);
    expect((float) $response->json('data.0.remaining'))->toBe(10.0);
});

test('guests cannot view bom items', function () {
    $quotation = Quotation::factory()->create();

    $this->getJson(route('quotations.bom-items.index', $quotation))
        ->assertUnauthorized();
});
