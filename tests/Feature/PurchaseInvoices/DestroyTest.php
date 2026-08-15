<?php

use App\Models\PurchaseInvoice;
use App\Models\User;

test('draft purchase invoice can be deleted', function () {
    $user = User::factory()->create();
    $purchaseInvoice = PurchaseInvoice::factory()->create(['status' => 'draft']);

    $response = $this->actingAs($user)->delete(route('purchase-invoices.destroy', $purchaseInvoice));

    $response->assertRedirect(route('purchase-invoices.index'));
    expect(PurchaseInvoice::find($purchaseInvoice->id))->toBeNull();
});

test('issued purchase invoice cannot be deleted', function () {
    $user = User::factory()->create();
    $purchaseInvoice = PurchaseInvoice::factory()->create(['status' => 'issued']);

    $this->actingAs($user)
        ->delete(route('purchase-invoices.destroy', $purchaseInvoice))
        ->assertForbidden();

    expect(PurchaseInvoice::find($purchaseInvoice->id))->not->toBeNull();
});

test('guests cannot delete purchase invoices', function () {
    $purchaseInvoice = PurchaseInvoice::factory()->create();

    $this->delete(route('purchase-invoices.destroy', $purchaseInvoice))
        ->assertRedirect(route('login'));
});
