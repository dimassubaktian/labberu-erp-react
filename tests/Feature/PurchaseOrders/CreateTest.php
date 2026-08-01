<?php

use App\Models\User;
use Inertia\Testing\AssertableInertia as Assert;

test('purchase order create page is displayed', function () {
    $user = User::factory()->create();

    $this->actingAs($user)
        ->get(route('purchase-orders.create'))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('purchase-orders/create'),
        );
});

test('guests cannot view the purchase order create page', function () {
    $this->get(route('purchase-orders.create'))
        ->assertRedirect(route('login'));
});
