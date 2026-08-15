<?php

use App\Models\PurchaseInvoice;
use App\Models\User;
use Inertia\Testing\AssertableInertia as Assert;

test('purchase invoice show page is displayed', function () {
    $user = User::factory()->create();
    $purchaseInvoice = PurchaseInvoice::factory()->create();

    $this->actingAs($user)
        ->get(route('purchase-invoices.show', $purchaseInvoice))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('purchase-invoices/show')
            ->where('purchaseInvoice.id', $purchaseInvoice->id),
        );
});

test('guests cannot view a purchase invoice', function () {
    $purchaseInvoice = PurchaseInvoice::factory()->create();

    $this->get(route('purchase-invoices.show', $purchaseInvoice))
        ->assertRedirect(route('login'));
});
