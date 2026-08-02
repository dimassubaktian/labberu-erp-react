<?php

use App\Models\GoodsReceiptNote;
use App\Models\User;
use Inertia\Testing\AssertableInertia as Assert;

test('goods receipt note show page is displayed', function () {
    $user = User::factory()->create();
    $goodsReceiptNote = GoodsReceiptNote::factory()->create();

    $this->actingAs($user)
        ->get(route('goods-receipt-notes.show', $goodsReceiptNote))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('goods-receipt-notes/show')
            ->where('goodsReceiptNote.id', $goodsReceiptNote->id),
        );
});

test('guests cannot view a goods receipt note', function () {
    $goodsReceiptNote = GoodsReceiptNote::factory()->create();

    $this->get(route('goods-receipt-notes.show', $goodsReceiptNote))
        ->assertRedirect(route('login'));
});
