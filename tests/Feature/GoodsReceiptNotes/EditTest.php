<?php

use App\Models\GoodsReceiptNote;
use App\Models\User;
use Inertia\Testing\AssertableInertia as Assert;

test('draft goods receipt note edit page is displayed', function () {
    $user = User::factory()->create();
    $goodsReceiptNote = GoodsReceiptNote::factory()->create(['status' => 'draft']);

    $this->actingAs($user)
        ->get(route('goods-receipt-notes.edit', $goodsReceiptNote))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('goods-receipt-notes/edit'),
        );
});

test('confirmed goods receipt note cannot be edited', function () {
    $user = User::factory()->create();
    $goodsReceiptNote = GoodsReceiptNote::factory()->create(['status' => 'confirmed']);

    $this->actingAs($user)
        ->get(route('goods-receipt-notes.edit', $goodsReceiptNote))
        ->assertForbidden();
});

test('guests cannot view the edit page', function () {
    $goodsReceiptNote = GoodsReceiptNote::factory()->create(['status' => 'draft']);

    $this->get(route('goods-receipt-notes.edit', $goodsReceiptNote))
        ->assertRedirect(route('login'));
});
