<?php

use App\Models\Product;
use App\Models\Project;
use App\Models\PurchaseOrder;
use App\Models\User;
use App\Models\Workforce;

test('draft purchase order can be updated with totals recalculated', function () {
    $user = User::factory()->create();
    $purchaseOrder = PurchaseOrder::factory()->create(['status' => 'draft']);
    $product = Product::factory()->create();

    $response = $this->actingAs($user)->put(route('purchase-orders.update', $purchaseOrder), [
        'project_id' => $purchaseOrder->project_id,
        'quotation_id' => $purchaseOrder->quotation_id,
        'customer_id' => $purchaseOrder->customer_id,
        'vendor_id' => $purchaseOrder->vendor_id,
        'project_name' => $purchaseOrder->project_name,
        'date' => now()->toDateString(),
        'currency_id' => $purchaseOrder->currency_id,
        'items' => [
            ['product_id' => $product->id, 'quantity' => 3, 'unit' => 'Pcs', 'unit_price' => 50_000],
        ],
    ]);

    $response->assertSessionHasNoErrors();
    $response->assertRedirect(route('purchase-orders.show', $purchaseOrder));

    $purchaseOrder->refresh();
    expect((float) $purchaseOrder->subtotal)->toBe(150_000.0);
    expect($purchaseOrder->items()->count())->toBe(1);
});

test('the attention field can be updated', function () {
    $user = User::factory()->create();
    $purchaseOrder = PurchaseOrder::factory()->create(['status' => 'draft']);
    $product = Product::factory()->create();

    $this->actingAs($user)->put(route('purchase-orders.update', $purchaseOrder), [
        'project_id' => $purchaseOrder->project_id,
        'quotation_id' => $purchaseOrder->quotation_id,
        'customer_id' => $purchaseOrder->customer_id,
        'vendor_id' => $purchaseOrder->vendor_id,
        'attention' => 'John Smith',
        'project_name' => $purchaseOrder->project_name,
        'date' => now()->toDateString(),
        'currency_id' => $purchaseOrder->currency_id,
        'items' => [
            ['product_id' => $product->id, 'quantity' => 1, 'unit' => 'Pcs', 'unit_price' => 1000],
        ],
    ])->assertSessionHasNoErrors();

    expect($purchaseOrder->refresh()->attention)->toBe('John Smith');
});

test('the project cannot be changed once a purchase order is created', function () {
    $user = User::factory()->create();
    $purchaseOrder = PurchaseOrder::factory()->create(['status' => 'draft']);
    $otherProject = Project::factory()->create();
    $product = Product::factory()->create();

    $this->actingAs($user)->put(route('purchase-orders.update', $purchaseOrder), [
        'project_id' => $otherProject->id,
        'quotation_id' => $purchaseOrder->quotation_id,
        'customer_id' => $purchaseOrder->customer_id,
        'vendor_id' => $purchaseOrder->vendor_id,
        'project_name' => $purchaseOrder->project_name,
        'date' => now()->toDateString(),
        'currency_id' => $purchaseOrder->currency_id,
        'items' => [
            ['product_id' => $product->id, 'quantity' => 1, 'unit' => 'Pcs', 'unit_price' => 1000],
        ],
    ])->assertSessionHasErrors(['project_id']);

    expect($purchaseOrder->refresh()->project_id)->not->toBe($otherProject->id);
});

test('an approved purchase order can be updated, reverting it to draft and clearing sign-offs', function () {
    $user = User::factory()->create();
    $purchaseOrder = PurchaseOrder::factory()->create([
        'status' => 'approved',
        'issued_by_id' => Workforce::factory()->create()->id,
        'issued_at' => now(),
        'checked_by_1_id' => Workforce::factory()->create()->id,
        'checked_by_1_at' => now(),
        'checked_by_2_id' => Workforce::factory()->create()->id,
        'checked_by_2_at' => now(),
        'approved_by_id' => Workforce::factory()->create()->id,
        'approved_at' => now(),
    ]);
    $product = Product::factory()->create();

    $response = $this->actingAs($user)->put(route('purchase-orders.update', $purchaseOrder), [
        'project_id' => $purchaseOrder->project_id,
        'quotation_id' => $purchaseOrder->quotation_id,
        'customer_id' => $purchaseOrder->customer_id,
        'vendor_id' => $purchaseOrder->vendor_id,
        'project_name' => $purchaseOrder->project_name,
        'date' => now()->toDateString(),
        'currency_id' => $purchaseOrder->currency_id,
        'items' => [
            ['product_id' => $product->id, 'quantity' => 2, 'unit' => 'Pcs', 'unit_price' => 25_000],
        ],
    ]);

    $response->assertSessionHasNoErrors();
    $response->assertRedirect(route('purchase-orders.show', $purchaseOrder));

    $purchaseOrder->refresh();
    expect($purchaseOrder->status)->toBe('draft');
    expect($purchaseOrder->issued_by_id)->toBeNull();
    expect($purchaseOrder->issued_at)->toBeNull();
    expect($purchaseOrder->checked_by_1_id)->toBeNull();
    expect($purchaseOrder->checked_by_1_at)->toBeNull();
    expect($purchaseOrder->checked_by_2_id)->toBeNull();
    expect($purchaseOrder->checked_by_2_at)->toBeNull();
    expect($purchaseOrder->approved_by_id)->toBeNull();
    expect($purchaseOrder->approved_at)->toBeNull();
    expect((float) $purchaseOrder->subtotal)->toBe(50_000.0);
});

test('non-draft, non-approved purchase orders cannot be updated', function () {
    $user = User::factory()->create();
    $purchaseOrder = PurchaseOrder::factory()->create(['status' => 'issued']);
    $product = Product::factory()->create();

    $this->actingAs($user)->put(route('purchase-orders.update', $purchaseOrder), [
        'project_id' => $purchaseOrder->project_id,
        'quotation_id' => $purchaseOrder->quotation_id,
        'customer_id' => $purchaseOrder->customer_id,
        'vendor_id' => $purchaseOrder->vendor_id,
        'project_name' => $purchaseOrder->project_name,
        'date' => now()->toDateString(),
        'currency_id' => $purchaseOrder->currency_id,
        'items' => [
            ['product_id' => $product->id, 'quantity' => 1, 'unit' => 'Pcs', 'unit_price' => 1000],
        ],
    ])->assertForbidden();
});

test('guests cannot update purchase orders', function () {
    $purchaseOrder = PurchaseOrder::factory()->create();

    $this->put(route('purchase-orders.update', $purchaseOrder), [])
        ->assertRedirect(route('login'));
});
