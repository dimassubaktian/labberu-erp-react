<?php

use App\Models\Invoice;
use App\Models\User;

test('draft invoice can be issued', function () {
    $user = User::factory()->create();
    $invoice = Invoice::factory()->create(['status' => 'draft']);

    $response = $this->actingAs($user)->patch(route('invoices.issue', $invoice));

    $response->assertSessionHasNoErrors();
    $response->assertRedirect(route('invoices.show', $invoice));

    $invoice->refresh();
    expect($invoice->status)->toBe('issued');
    expect($invoice->issued_at)->not->toBeNull();
});

test('issued invoice cannot be issued again', function () {
    $user = User::factory()->create();
    $invoice = Invoice::factory()->create(['status' => 'issued']);

    $this->actingAs($user)
        ->patch(route('invoices.issue', $invoice))
        ->assertForbidden();
});

test('guests cannot issue invoices', function () {
    $invoice = Invoice::factory()->create(['status' => 'draft']);

    $this->patch(route('invoices.issue', $invoice))
        ->assertRedirect(route('login'));
});
