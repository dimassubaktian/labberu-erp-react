<?php

use App\Models\Currency;
use App\Models\Project;
use App\Models\PurchaseInvoice;
use App\Models\PurchaseOrder;
use App\Models\User;

function issuedPurchaseInvoice(PurchaseOrder $purchaseOrder, float $subtotal, float $discount = 0, float $tax = 0): PurchaseInvoice
{
    return PurchaseInvoice::factory()->create([
        'purchase_order_id' => $purchaseOrder->id,
        'status' => 'issued',
        'subtotal' => $subtotal,
        'discount_amount' => $discount,
        'tax_amount' => $tax,
        'total' => $subtotal - $discount + $tax,
    ]);
}

test('actual cost is null until a purchase invoice is issued', function () {
    $project = Project::factory()->create();
    PurchaseOrder::factory()->create(['project_id' => $project->id, 'grand_total' => 5_000_000]);

    $project->recomputeActualCost();

    expect($project->refresh()->actual_cost)->toBeNull();
});

test('actual cost sums issued purchase invoices across every purchase order on the project', function () {
    $project = Project::factory()->create();
    $first = PurchaseOrder::factory()->create(['project_id' => $project->id]);
    $second = PurchaseOrder::factory()->create(['project_id' => $project->id]);

    issuedPurchaseInvoice($first, 1_000_000);
    issuedPurchaseInvoice($first, 500_000);
    issuedPurchaseInvoice($second, 250_000);

    $project->recomputeActualCost();

    expect((float) $project->refresh()->actual_cost)->toBe(1_750_000.0);
});

test('actual cost is net of discount and excludes tax', function () {
    $project = Project::factory()->create();
    $purchaseOrder = PurchaseOrder::factory()->create(['project_id' => $project->id]);

    issuedPurchaseInvoice($purchaseOrder, subtotal: 1_000_000, discount: 100_000, tax: 99_000);

    $project->recomputeActualCost();

    expect((float) $project->refresh()->actual_cost)->toBe(900_000.0);
});

test('draft purchase invoices do not count towards actual cost', function () {
    $project = Project::factory()->create();
    $purchaseOrder = PurchaseOrder::factory()->create(['project_id' => $project->id]);

    issuedPurchaseInvoice($purchaseOrder, 1_000_000);
    PurchaseInvoice::factory()->create([
        'purchase_order_id' => $purchaseOrder->id,
        'status' => 'draft',
        'subtotal' => 4_000_000,
        'total' => 4_000_000,
    ]);

    $project->recomputeActualCost();

    expect((float) $project->refresh()->actual_cost)->toBe(1_000_000.0);
});

test('foreign currency purchase orders are converted with their snapshotted rate', function () {
    $project = Project::factory()->create();
    $usd = Currency::factory()->create(['iso_code' => 'USD', 'base_currency' => false]);

    $local = PurchaseOrder::factory()->create(['project_id' => $project->id, 'exchange_rate' => 1]);
    $foreign = PurchaseOrder::factory()->create([
        'project_id' => $project->id,
        'currency_id' => $usd->id,
        'exchange_rate' => 16_000,
    ]);

    issuedPurchaseInvoice($local, 1_000_000);
    issuedPurchaseInvoice($foreign, 100);

    $project->recomputeActualCost();

    expect((float) $project->refresh()->actual_cost)->toBe(2_600_000.0);
});

test('issuing a purchase invoice recomputes the project actual cost', function () {
    $user = User::factory()->create();
    $project = Project::factory()->create();
    $purchaseOrder = PurchaseOrder::factory()->create(['project_id' => $project->id]);
    $purchaseInvoice = PurchaseInvoice::factory()->create([
        'purchase_order_id' => $purchaseOrder->id,
        'status' => 'draft',
        'subtotal' => 750_000,
        'discount_amount' => 50_000,
        'total' => 700_000,
    ]);

    $this->actingAs($user)
        ->patch(route('purchase-invoices.issue', $purchaseInvoice))
        ->assertSessionHasNoErrors();

    expect((float) $project->refresh()->actual_cost)->toBe(700_000.0);
});

test('purchase invoices on another project do not leak into this project', function () {
    $project = Project::factory()->create();
    $otherProject = Project::factory()->create();

    issuedPurchaseInvoice(PurchaseOrder::factory()->create(['project_id' => $project->id]), 1_000_000);
    issuedPurchaseInvoice(PurchaseOrder::factory()->create(['project_id' => $otherProject->id]), 9_000_000);

    $project->recomputeActualCost();

    expect((float) $project->refresh()->actual_cost)->toBe(1_000_000.0);
});
