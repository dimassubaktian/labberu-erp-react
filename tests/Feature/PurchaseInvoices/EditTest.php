<?php

use App\Models\PurchaseInvoice;
use App\Models\User;
use Inertia\Testing\AssertableInertia as Assert;

test('draft purchase invoice edit page is displayed', function () {
    $user = User::factory()->create();
    $purchaseInvoice = PurchaseInvoice::factory()->create(['status' => 'draft']);

    $this->actingAs($user)
        ->get(route('purchase-invoices.edit', $purchaseInvoice))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page->component('purchase-invoices/edit'));
});

test('issued purchase invoice cannot be edited', function () {
    $user = User::factory()->create();
    $purchaseInvoice = PurchaseInvoice::factory()->create(['status' => 'issued']);

    $this->actingAs($user)
        ->get(route('purchase-invoices.edit', $purchaseInvoice))
        ->assertForbidden();
});

test('guests cannot view the edit page', function () {
    $purchaseInvoice = PurchaseInvoice::factory()->create(['status' => 'draft']);

    $this->get(route('purchase-invoices.edit', $purchaseInvoice))
        ->assertRedirect(route('login'));
});
