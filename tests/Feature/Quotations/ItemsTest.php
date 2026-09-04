<?php

use App\Models\DeliveryOrder;
use App\Models\Invoice;
use App\Models\Product;
use App\Models\Quotation;
use App\Models\User;

test('quotation items are listed with delivered and remaining quantities', function () {
    $user = User::factory()->create();
    $quotation = Quotation::factory()->create();
    $item = $quotation->items()->create([
        'product_id' => Product::factory()->create()->id,
        'quantity' => 10,
        'unit' => 'Pcs',
        'unit_price' => 1_000,
        'unit_cost' => 500,
        'total_price' => 10_000,
        'total_cost' => 5_000,
        'margin' => 5_000,
        'margin_percent' => 50,
    ]);

    $deliveryOrder = DeliveryOrder::factory()->create([
        'quotation_id' => $quotation->id,
        'status' => 'confirmed',
    ]);
    $deliveryOrder->items()->create([
        'product_id' => $item->product_id,
        'quotation_item_id' => $item->id,
        'quantity_ordered' => $item->quantity,
        'unit' => $item->unit,
        'quantity_delivered' => 4,
    ]);

    $response = $this->actingAs($user)
        ->getJson(route('quotations.items.index', $quotation))
        ->assertOk()
        ->assertJsonCount(1, 'data');

    expect((float) $response->json('data.0.delivered'))->toBe(4.0);
    expect((float) $response->json('data.0.remaining'))->toBe(6.0);
});

test('draft delivery orders are excluded from the delivered quantity', function () {
    $user = User::factory()->create();
    $quotation = Quotation::factory()->create();
    $item = $quotation->items()->create([
        'product_id' => Product::factory()->create()->id,
        'quantity' => 10,
        'unit' => 'Pcs',
        'unit_price' => 1_000,
        'unit_cost' => 500,
        'total_price' => 10_000,
        'total_cost' => 5_000,
        'margin' => 5_000,
        'margin_percent' => 50,
    ]);

    $deliveryOrder = DeliveryOrder::factory()->create([
        'quotation_id' => $quotation->id,
        'status' => 'draft',
    ]);
    $deliveryOrder->items()->create([
        'product_id' => $item->product_id,
        'quotation_item_id' => $item->id,
        'quantity_ordered' => $item->quantity,
        'unit' => $item->unit,
        'quantity_delivered' => 4,
    ]);

    $response = $this->actingAs($user)
        ->getJson(route('quotations.items.index', $quotation))
        ->assertOk();

    expect((float) $response->json('data.0.delivered'))->toBe(0.0);
    expect((float) $response->json('data.0.remaining'))->toBe(10.0);
});

test('quotation items include deliveries from all quotation revisions', function () {
    $user = User::factory()->create();
    $quotation = Quotation::factory()->create();
    $item = $quotation->items()->create([
        'product_id' => Product::factory()->create()->id,
        'quantity' => 10,
        'unit' => 'Pcs',
        'unit_price' => 1_000,
        'unit_cost' => 500,
        'total_price' => 10_000,
        'total_cost' => 5_000,
        'margin' => 5_000,
        'margin_percent' => 50,
    ]);
    $revision = Quotation::factory()->create([
        'project_id' => $quotation->project_id,
        'currency_id' => $quotation->currency_id,
        'quotation_code' => $quotation->quotation_code,
        'root_quotation_id' => $quotation->id,
        'version_major' => 1,
        'version_minor' => 1,
    ]);
    $revisionItem = $revision->items()->create([
        'product_id' => $item->product_id,
        'lineage_uuid' => $item->lineage_uuid,
        'quantity' => 10,
        'unit' => 'Pcs',
        'unit_price' => 1_000,
        'unit_cost' => 500,
        'total_price' => 10_000,
        'total_cost' => 5_000,
        'margin' => 5_000,
        'margin_percent' => 50,
    ]);
    $deliveryOrder = DeliveryOrder::factory()->create([
        'quotation_id' => $quotation->id,
        'status' => 'confirmed',
    ]);
    $deliveryOrder->items()->create([
        'product_id' => $item->product_id,
        'quotation_item_id' => $item->id,
        'quantity_ordered' => $item->quantity,
        'unit' => $item->unit,
        'quantity_delivered' => 4,
    ]);

    $response = $this->actingAs($user)
        ->getJson(route('quotations.items.index', $revision))
        ->assertOk();

    expect($revisionItem->lineage_uuid)->toBe($item->lineage_uuid);
    expect((float) $response->json('data.0.delivered'))->toBe(4.0);
    expect((float) $response->json('data.0.remaining'))->toBe(6.0);
});

test('quotation items are listed with unit price and invoiced/remaining-to-invoice quantities', function () {
    $user = User::factory()->create();
    $quotation = Quotation::factory()->create();
    $item = $quotation->items()->create([
        'product_id' => Product::factory()->create()->id,
        'quantity' => 10,
        'unit' => 'Pcs',
        'unit_price' => 100_000,
        'unit_cost' => 50_000,
        'total_price' => 1_000_000,
        'total_cost' => 500_000,
        'margin' => 500_000,
        'margin_percent' => 50,
    ]);

    $invoice = Invoice::factory()->create(['quotation_id' => $quotation->id]);
    $invoice->items()->create([
        'product_id' => $item->product_id,
        'quotation_item_id' => $item->id,
        'quantity_ordered' => $item->quantity,
        'unit' => $item->unit,
        'unit_price' => $item->unit_price,
        'quantity_invoiced' => 4,
        'total' => 400_000,
    ]);

    $response = $this->actingAs($user)
        ->getJson(route('quotations.items.index', $quotation))
        ->assertOk();

    expect((float) $response->json('data.0.unit_price'))->toBe(100_000.0);
    expect((float) $response->json('data.0.invoiced'))->toBe(4.0);
    expect((float) $response->json('data.0.remaining_to_invoice'))->toBe(6.0);
});

test('draft invoices still count toward the invoiced quantity', function () {
    $user = User::factory()->create();
    $quotation = Quotation::factory()->create();
    $item = $quotation->items()->create([
        'product_id' => Product::factory()->create()->id,
        'quantity' => 10,
        'unit' => 'Pcs',
        'unit_price' => 100_000,
        'unit_cost' => 50_000,
        'total_price' => 1_000_000,
        'total_cost' => 500_000,
        'margin' => 500_000,
        'margin_percent' => 50,
    ]);

    $invoice = Invoice::factory()->create(['quotation_id' => $quotation->id, 'status' => 'draft']);
    $invoice->items()->create([
        'product_id' => $item->product_id,
        'quotation_item_id' => $item->id,
        'quantity_ordered' => $item->quantity,
        'unit' => $item->unit,
        'unit_price' => $item->unit_price,
        'quantity_invoiced' => 4,
        'total' => 400_000,
    ]);

    $response = $this->actingAs($user)
        ->getJson(route('quotations.items.index', $quotation))
        ->assertOk();

    expect((float) $response->json('data.0.invoiced'))->toBe(4.0);
    expect((float) $response->json('data.0.remaining_to_invoice'))->toBe(6.0);
});

test('guests cannot view quotation items', function () {
    $quotation = Quotation::factory()->create();

    $this->getJson(route('quotations.items.index', $quotation))
        ->assertUnauthorized();
});
