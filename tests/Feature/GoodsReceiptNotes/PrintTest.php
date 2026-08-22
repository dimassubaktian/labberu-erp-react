<?php

use App\Models\GoodsReceiptNote;
use App\Models\Product;
use App\Models\PurchaseOrder;
use App\Models\User;

function goodsReceiptNoteWithItem(array $overrides = []): GoodsReceiptNote
{
    $goodsReceiptNote = GoodsReceiptNote::factory()->create(array_merge([
        'purchase_order_id' => PurchaseOrder::factory()->create()->id,
    ], $overrides));

    $goodsReceiptNote->items()->create([
        'product_id' => Product::factory()->create()->id,
        'quantity_ordered' => 10,
        'unit' => 'Pcs',
        'quantity_accepted' => 8,
        'quantity_rejected' => 2,
        'rejection_reason' => 'Damaged in transit',
    ]);

    return $goodsReceiptNote->fresh('items');
}

test('goods receipt note print streams pdf inline by default', function () {
    $user = User::factory()->create();
    $goodsReceiptNote = goodsReceiptNoteWithItem();

    $response = $this->actingAs($user)
        ->get(route('goods-receipt-notes.print', $goodsReceiptNote));

    $response->assertOk();
    $response->assertHeader('Content-Type', 'application/pdf');
    expect($response->headers->get('Content-Disposition'))->toContain('inline');
});

test('goods receipt note print forces download when download param is true', function () {
    $user = User::factory()->create();
    $goodsReceiptNote = goodsReceiptNoteWithItem();

    $response = $this->actingAs($user)
        ->get(route('goods-receipt-notes.print', [$goodsReceiptNote, 'download' => 'true']));

    $response->assertOk();
    $response->assertHeader('Content-Type', 'application/pdf');
    expect($response->headers->get('Content-Disposition'))->toContain('attachment');
    expect($response->headers->get('Content-Disposition'))->toContain("goods-receipt-note-{$goodsReceiptNote->grn_code}.pdf");
});

test('guests cannot print a goods receipt note', function () {
    $goodsReceiptNote = goodsReceiptNoteWithItem();

    $this->get(route('goods-receipt-notes.print', $goodsReceiptNote))
        ->assertRedirect(route('login'));
});
