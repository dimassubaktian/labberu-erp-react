<?php

use App\Models\Currency;
use App\Models\User;

test('currency can be deleted', function () {
    $user = User::factory()->create();
    $currency = Currency::factory()->create();

    $response = $this->actingAs($user)
        ->delete(route('currencies.destroy', $currency));

    $response->assertRedirect(route('currencies.index'));

    $this->assertSoftDeleted($currency);
});

test('guests cannot delete currencies', function () {
    $currency = Currency::factory()->create();

    $this->delete(route('currencies.destroy', $currency))
        ->assertRedirect(route('login'));

    $this->assertNotSoftDeleted($currency);
});
