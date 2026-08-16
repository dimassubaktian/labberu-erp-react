<?php

use App\Models\Currency;
use App\Models\Customer;
use App\Models\Product;
use App\Models\Project;
use App\Models\PurchaseOrder;
use App\Models\Quotation;
use App\Models\Tax;
use App\Models\User;
use App\Models\Vendor;

function purchaseOrderPayload(array $overrides = []): array
{
    $project = Project::factory()->create();
    $quotation = Quotation::factory()->create(['project_id' => $project->id]);
    $currency = Currency::factory()->create();

    return array_merge([
        'project_id' => $project->id,
        'quotation_id' => $quotation->id,
        'customer_id' => Customer::factory()->create()->id,
        'vendor_id' => Vendor::factory()->create()->id,
        'project_name' => $project->name,
        'date' => now()->toDateString(),
        'currency_id' => $currency->id,
        'exchange_rate' => 1,
        'items' => [],
    ], $overrides);
}

test('the exchange rate is snapshotted on the purchase order', function () {
    $user = User::factory()->create();
    $product = Product::factory()->create();

    $this->actingAs($user)->post(route('purchase-orders.store'), purchaseOrderPayload([
        'exchange_rate' => 16_250.5,
        'items' => [
            ['product_id' => $product->id, 'quantity' => 1, 'unit' => 'Pcs', 'unit_price' => 100],
        ],
    ]))->assertSessionHasNoErrors();

    expect((float) PurchaseOrder::sole()->exchange_rate)->toBe(16_250.5);
});

test('the exchange rate must be greater than zero', function () {
    $user = User::factory()->create();
    $product = Product::factory()->create();

    $this->actingAs($user)->post(route('purchase-orders.store'), purchaseOrderPayload([
        'exchange_rate' => 0,
        'items' => [
            ['product_id' => $product->id, 'quantity' => 1, 'unit' => 'Pcs', 'unit_price' => 100],
        ],
    ]))->assertSessionHasErrors('exchange_rate');
});

test('purchase order can be created with totals calculated', function () {
    $user = User::factory()->create();
    $product = Product::factory()->create();

    $response = $this->actingAs($user)->post(route('purchase-orders.store'), purchaseOrderPayload([
        'items' => [
            [
                'product_id' => $product->id,
                'quantity' => 2,
                'unit' => 'Pcs',
                'unit_price' => 100_000,
            ],
        ],
    ]));

    $response->assertSessionHasNoErrors();

    $purchaseOrder = PurchaseOrder::sole();
    $response->assertRedirect(route('purchase-orders.show', $purchaseOrder));

    expect((float) $purchaseOrder->subtotal)->toBe(200_000.0);
    expect((float) $purchaseOrder->discount_total)->toBe(0.0);
    expect((float) $purchaseOrder->net_after_discount)->toBe(200_000.0);
    expect((float) $purchaseOrder->tax_amount)->toBe(0.0);
    expect((float) $purchaseOrder->grand_total)->toBe(200_000.0);
    expect($purchaseOrder->status)->toBe('draft');

    $item = $purchaseOrder->items()->sole();
    expect((float) $item->total)->toBe(200_000.0);
});

test('the attention field is saved', function () {
    $user = User::factory()->create();
    $product = Product::factory()->create();

    $this->actingAs($user)->post(route('purchase-orders.store'), purchaseOrderPayload([
        'attention' => 'Jane Doe',
        'items' => [
            ['product_id' => $product->id, 'quantity' => 1, 'unit' => 'Pcs', 'unit_price' => 1000],
        ],
    ]))->assertSessionHasNoErrors();

    expect(PurchaseOrder::sole()->attention)->toBe('Jane Doe');
});

test('the notes html field is saved', function () {
    $user = User::factory()->create();
    $product = Product::factory()->create();

    $this->actingAs($user)->post(route('purchase-orders.store'), purchaseOrderPayload([
        'notes_html' => '<ol><li><p>Custom note.</p></li></ol>',
        'items' => [
            ['product_id' => $product->id, 'quantity' => 1, 'unit' => 'Pcs', 'unit_price' => 1000],
        ],
    ]))->assertSessionHasNoErrors();

    expect(PurchaseOrder::sole()->notes_html)->toBe('<ol><li><p>Custom note.</p></li></ol>');
});

test('a line item imported from a bom remembers its source bom item', function () {
    $user = User::factory()->create();
    $quotation = Quotation::factory()->create();
    $bom = $quotation->bom()->create([]);
    $product = Product::factory()->create();
    $bomItem = $bom->items()->create([
        'product_id' => $product->id,
        'brand' => 'ABB',
        'quantity' => 5,
        'unit' => 'Pcs',
        'unit_cost' => 10_000,
        'total_cost' => 50_000,
    ]);

    $this->actingAs($user)->post(route('purchase-orders.store'), purchaseOrderPayload([
        'quotation_id' => $quotation->id,
        'items' => [
            [
                'product_id' => $product->id,
                'bom_item_id' => $bomItem->id,
                'quantity' => 5,
                'unit' => 'Pcs',
                'unit_price' => 10_000,
            ],
        ],
    ]))->assertSessionHasNoErrors();

    $item = PurchaseOrder::sole()->items()->sole();
    expect($item->bom_item_id)->toBe($bomItem->id);
});

test('cascading discount levels are applied in sequence against the running balance', function () {
    $user = User::factory()->create();
    $product = Product::factory()->create();

    $this->actingAs($user)->post(route('purchase-orders.store'), purchaseOrderPayload([
        'items' => [
            ['product_id' => $product->id, 'quantity' => 1, 'unit' => 'Pcs', 'unit_price' => 1_000_000],
        ],
        'discounts' => [
            ['label' => 'Discount I', 'discount_type' => 'percentage', 'discount_value' => 10],
            ['label' => 'Discount II', 'discount_type' => 'percentage', 'discount_value' => 10],
        ],
    ]))->assertSessionHasNoErrors();

    $purchaseOrder = PurchaseOrder::sole();

    $discountOne = $purchaseOrder->discounts()->where('sequence', 1)->sole();
    $discountTwo = $purchaseOrder->discounts()->where('sequence', 2)->sole();

    expect((float) $discountOne->base_amount)->toBe(1_000_000.0);
    expect((float) $discountOne->discount_amount)->toBe(100_000.0);

    expect((float) $discountTwo->base_amount)->toBe(900_000.0);
    expect((float) $discountTwo->discount_amount)->toBe(90_000.0);

    expect((float) $purchaseOrder->discount_total)->toBe(190_000.0);
    expect((float) $purchaseOrder->net_after_discount)->toBe(810_000.0);
    expect((float) $purchaseOrder->grand_total)->toBe(810_000.0);
});

test('tax is applied after the cascading discounts, on the net balance', function () {
    $user = User::factory()->create();
    $product = Product::factory()->create();
    $tax = Tax::factory()->percentage()->create(['rate' => 11]);

    $this->actingAs($user)->post(route('purchase-orders.store'), purchaseOrderPayload([
        'tax_id' => $tax->id,
        'items' => [
            ['product_id' => $product->id, 'quantity' => 1, 'unit' => 'Pcs', 'unit_price' => 1_000_000],
        ],
        'discounts' => [
            ['label' => 'Discount I', 'discount_type' => 'percentage', 'discount_value' => 10],
        ],
    ]))->assertSessionHasNoErrors();

    $purchaseOrder = PurchaseOrder::sole();

    expect((float) $purchaseOrder->net_after_discount)->toBe(900_000.0);
    expect((float) $purchaseOrder->tax_amount)->toBe(99_000.0);
    expect((float) $purchaseOrder->grand_total)->toBe(999_000.0);
});

test('required fields are validated', function () {
    $user = User::factory()->create();

    $this->actingAs($user)
        ->post(route('purchase-orders.store'), [])
        ->assertSessionHasErrors(['project_id', 'quotation_id', 'customer_id', 'vendor_id', 'project_name', 'date', 'currency_id', 'items']);
});

test('at least one line item is required', function () {
    $user = User::factory()->create();

    $this->actingAs($user)
        ->post(route('purchase-orders.store'), purchaseOrderPayload(['items' => []]))
        ->assertSessionHasErrors(['items']);
});

test('guests cannot create purchase orders', function () {
    $this->post(route('purchase-orders.store'), [])
        ->assertRedirect(route('login'));
});
