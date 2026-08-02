<?php

use App\Models\Invoice;
use App\Models\User;
use Inertia\Testing\AssertableInertia as Assert;

test('draft invoice edit page is displayed', function () {
    $user = User::factory()->create();
    $invoice = Invoice::factory()->create(['status' => 'draft']);

    $this->actingAs($user)
        ->get(route('invoices.edit', $invoice))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page->component('invoices/edit'));
});

test('issued invoice cannot be edited', function () {
    $user = User::factory()->create();
    $invoice = Invoice::factory()->create(['status' => 'issued']);

    $this->actingAs($user)
        ->get(route('invoices.edit', $invoice))
        ->assertForbidden();
});

test('guests cannot view the edit page', function () {
    $invoice = Invoice::factory()->create(['status' => 'draft']);

    $this->get(route('invoices.edit', $invoice))
        ->assertRedirect(route('login'));
});
