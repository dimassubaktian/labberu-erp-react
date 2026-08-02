<?php

use App\Models\GoodsReceiptNote;
use App\Models\User;

test('draft goods receipt note can be deleted', function () {
    $user = User::factory()->create();
    $goodsReceiptNote = GoodsReceiptNote::factory()->create(['status' => 'draft']);

    $response = $this->actingAs($user)->delete(route('goods-receipt-notes.destroy', $goodsReceiptNote));

    $response->assertRedirect(route('goods-receipt-notes.index'));
    expect(GoodsReceiptNote::find($goodsReceiptNote->id))->toBeNull();
});

test('confirmed goods receipt note cannot be deleted', function () {
    $user = User::factory()->create();
    $goodsReceiptNote = GoodsReceiptNote::factory()->create(['status' => 'confirmed']);

    $this->actingAs($user)
        ->delete(route('goods-receipt-notes.destroy', $goodsReceiptNote))
        ->assertForbidden();

    expect(GoodsReceiptNote::find($goodsReceiptNote->id))->not->toBeNull();
});

test('guests cannot delete goods receipt notes', function () {
    $goodsReceiptNote = GoodsReceiptNote::factory()->create();

    $this->delete(route('goods-receipt-notes.destroy', $goodsReceiptNote))
        ->assertRedirect(route('login'));
});
