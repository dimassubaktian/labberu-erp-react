<?php

use App\Models\Product;
use App\Models\StockAdjustment;
use App\Models\StockMovement;
use App\Models\User;

test('an increase adjustment creates an in stock movement', function () {
    $user = User::factory()->create();
    $product = Product::factory()->create(['type' => 'goods']);

    $response = $this->actingAs($user)->post(route('stock-adjustments.store'), [
        'product_id' => $product->id,
        'type' => 'increase',
        'quantity' => 10,
        'reason' => 'Initial Stock Load',
        'note' => 'Opening balance',
    ]);

    $response->assertSessionHasNoErrors();
    $response->assertRedirect(route('stock-adjustments.index'));

    $adjustment = StockAdjustment::sole();
    expect($adjustment->product_id)->toBe($product->id);
    expect($adjustment->type)->toBe('increase');
    expect((float) $adjustment->quantity)->toBe(10.0);
    expect($adjustment->reason)->toBe('Initial Stock Load');
    expect($adjustment->adjusted_by)->toBe($user->id);

    $movement = StockMovement::sole();
    expect($movement->product_id)->toBe($product->id);
    expect($movement->type)->toBe('in');
    expect((float) $movement->quantity)->toBe(10.0);
    expect($movement->stock_adjustment_id)->toBe($adjustment->id);
});

test('a decrease adjustment creates an out stock movement', function () {
    $user = User::factory()->create();
    $product = Product::factory()->create(['type' => 'goods']);

    $this->actingAs($user)->post(route('stock-adjustments.store'), [
        'product_id' => $product->id,
        'type' => 'decrease',
        'quantity' => 3,
        'reason' => 'Damage',
    ])->assertSessionHasNoErrors();

    $movement = StockMovement::sole();
    expect($movement->type)->toBe('out');
    expect((float) $movement->quantity)->toBe(3.0);
});

test('adjusted_by is always the acting user, not user-supplied', function () {
    $user = User::factory()->create();
    $otherUser = User::factory()->create();
    $product = Product::factory()->create(['type' => 'goods']);

    $this->actingAs($user)->post(route('stock-adjustments.store'), [
        'product_id' => $product->id,
        'type' => 'increase',
        'quantity' => 5,
        'reason' => 'Other',
        'adjusted_by' => $otherUser->id,
    ])->assertSessionHasNoErrors();

    expect(StockAdjustment::sole()->adjusted_by)->toBe($user->id);
});

test('an invalid reason is rejected', function () {
    $user = User::factory()->create();
    $product = Product::factory()->create(['type' => 'goods']);

    $this->actingAs($user)->post(route('stock-adjustments.store'), [
        'product_id' => $product->id,
        'type' => 'increase',
        'quantity' => 5,
        'reason' => 'Not A Real Reason',
    ])->assertSessionHasErrors('reason');

    expect(StockAdjustment::count())->toBe(0);
});

test('an invalid type is rejected', function () {
    $user = User::factory()->create();
    $product = Product::factory()->create(['type' => 'goods']);

    $this->actingAs($user)->post(route('stock-adjustments.store'), [
        'product_id' => $product->id,
        'type' => 'sideways',
        'quantity' => 5,
        'reason' => 'Other',
    ])->assertSessionHasErrors('type');
});

test('guests cannot create stock adjustments', function () {
    $product = Product::factory()->create(['type' => 'goods']);

    $this->post(route('stock-adjustments.store'), [
        'product_id' => $product->id,
        'type' => 'increase',
        'quantity' => 5,
        'reason' => 'Other',
    ])->assertRedirect(route('login'));
});
