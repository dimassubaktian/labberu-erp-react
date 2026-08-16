<?php

use App\Models\Product;
use App\Models\PurchaseInvoice;
use App\Models\PurchaseOrder;
use App\Models\User;

function lockablePurchaseOrder(): PurchaseOrder
{
    $purchaseOrder = PurchaseOrder::factory()->create(['status' => 'approved']);

    $purchaseOrder->items()->create([
        'product_id' => Product::factory()->create(['type' => 'goods'])->id,
        'quantity' => 10,
        'unit' => 'Pcs',
        'unit_price' => 1_000,
        'total' => 10_000,
    ]);

    return $purchaseOrder->fresh('items');
}

function confirmGoodsReceipt(PurchaseOrder $purchaseOrder, string $status = 'confirmed'): void
{
    $goodsReceiptNote = $purchaseOrder->goodsReceiptNotes()->create([
        'vendor_id' => $purchaseOrder->vendor_id,
        'received_date' => now(),
        'status' => $status,
    ]);

    $item = $purchaseOrder->items->first();

    $goodsReceiptNote->items()->create([
        'product_id' => $item->product_id,
        'purchase_order_item_id' => $item->id,
        'quantity_ordered' => 10,
        'unit' => 'Pcs',
        'quantity_received' => 10,
        'quantity_accepted' => 10,
    ]);
}

function updatePayload(PurchaseOrder $purchaseOrder, Product $product): array
{
    return [
        'project_id' => $purchaseOrder->project_id,
        'quotation_id' => $purchaseOrder->quotation_id,
        'customer_id' => $purchaseOrder->customer_id,
        'vendor_id' => $purchaseOrder->vendor_id,
        'project_name' => $purchaseOrder->project_name,
        'date' => now()->toDateString(),
        'currency_id' => $purchaseOrder->currency_id,
        'exchange_rate' => 1,
        'items' => [
            ['product_id' => $product->id, 'quantity' => 1, 'unit' => 'Pcs', 'unit_price' => 500],
        ],
    ];
}

test('a purchase order with a confirmed goods receipt note cannot be edited', function () {
    $user = User::factory()->create();
    $purchaseOrder = lockablePurchaseOrder();
    confirmGoodsReceipt($purchaseOrder);

    $this->actingAs($user)
        ->get(route('purchase-orders.edit', $purchaseOrder))
        ->assertForbidden();

    $this->actingAs($user)
        ->put(route('purchase-orders.update', $purchaseOrder), updatePayload($purchaseOrder, Product::factory()->create()))
        ->assertForbidden();

    // The original line item survives, so received quantities stay attributable to it.
    expect($purchaseOrder->items()->count())->toBe(1);
    expect((float) $purchaseOrder->items()->sole()->unit_price)->toBe(1_000.0);
});

test('a purchase order with an issued purchase invoice cannot be edited', function () {
    $user = User::factory()->create();
    $purchaseOrder = lockablePurchaseOrder();
    PurchaseInvoice::factory()->create([
        'purchase_order_id' => $purchaseOrder->id,
        'status' => 'issued',
    ]);

    $this->actingAs($user)
        ->get(route('purchase-orders.edit', $purchaseOrder))
        ->assertForbidden();

    $this->actingAs($user)
        ->put(route('purchase-orders.update', $purchaseOrder), updatePayload($purchaseOrder, Product::factory()->create()))
        ->assertForbidden();
});

test('a draft goods receipt note does not lock the purchase order', function () {
    $user = User::factory()->create();
    $purchaseOrder = lockablePurchaseOrder();
    confirmGoodsReceipt($purchaseOrder, 'draft');

    $this->actingAs($user)
        ->get(route('purchase-orders.edit', $purchaseOrder))
        ->assertOk();
});

test('a draft purchase invoice does not lock the purchase order', function () {
    $user = User::factory()->create();
    $purchaseOrder = lockablePurchaseOrder();
    PurchaseInvoice::factory()->create([
        'purchase_order_id' => $purchaseOrder->id,
        'status' => 'draft',
    ]);

    $this->actingAs($user)
        ->put(route('purchase-orders.update', $purchaseOrder), updatePayload($purchaseOrder, Product::factory()->create()))
        ->assertSessionHasNoErrors();

    expect((float) $purchaseOrder->items()->sole()->unit_price)->toBe(500.0);
});

test('the show page reports whether the purchase order is locked', function () {
    $user = User::factory()->create();
    $purchaseOrder = lockablePurchaseOrder();

    $this->actingAs($user)
        ->get(route('purchase-orders.show', $purchaseOrder))
        ->assertOk()
        ->assertInertia(fn ($page) => $page->where('isLockedByReceiptsOrBilling', false));

    confirmGoodsReceipt($purchaseOrder);

    $this->actingAs($user)
        ->get(route('purchase-orders.show', $purchaseOrder))
        ->assertOk()
        ->assertInertia(fn ($page) => $page->where('isLockedByReceiptsOrBilling', true));
});
