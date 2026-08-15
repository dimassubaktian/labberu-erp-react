<?php

use App\Models\PurchaseInvoice;
use App\Models\User;

test('draft purchase invoice can be issued', function () {
    $user = User::factory()->create();
    $purchaseInvoice = PurchaseInvoice::factory()->create(['status' => 'draft']);

    $response = $this->actingAs($user)->patch(route('purchase-invoices.issue', $purchaseInvoice));

    $response->assertSessionHasNoErrors();
    $response->assertRedirect(route('purchase-invoices.show', $purchaseInvoice));

    $purchaseInvoice->refresh();
    expect($purchaseInvoice->status)->toBe('issued');
    expect($purchaseInvoice->issued_at)->not->toBeNull();
});

test('issued purchase invoice cannot be issued again', function () {
    $user = User::factory()->create();
    $purchaseInvoice = PurchaseInvoice::factory()->create(['status' => 'issued']);

    $this->actingAs($user)
        ->patch(route('purchase-invoices.issue', $purchaseInvoice))
        ->assertForbidden();
});

test('guests cannot issue purchase invoices', function () {
    $purchaseInvoice = PurchaseInvoice::factory()->create(['status' => 'draft']);

    $this->patch(route('purchase-invoices.issue', $purchaseInvoice))
        ->assertRedirect(route('login'));
});
