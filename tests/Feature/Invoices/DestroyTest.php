<?php

use App\Models\Invoice;
use App\Models\User;

test('draft invoice can be deleted', function () {
    $user = User::factory()->create();
    $invoice = Invoice::factory()->create(['status' => 'draft']);

    $response = $this->actingAs($user)->delete(route('invoices.destroy', $invoice));

    $response->assertRedirect(route('invoices.index'));
    expect(Invoice::find($invoice->id))->toBeNull();
});

test('issued invoice cannot be deleted', function () {
    $user = User::factory()->create();
    $invoice = Invoice::factory()->create(['status' => 'issued']);

    $this->actingAs($user)
        ->delete(route('invoices.destroy', $invoice))
        ->assertForbidden();

    expect(Invoice::find($invoice->id))->not->toBeNull();
});

test('guests cannot delete invoices', function () {
    $invoice = Invoice::factory()->create();

    $this->delete(route('invoices.destroy', $invoice))
        ->assertRedirect(route('login'));
});
