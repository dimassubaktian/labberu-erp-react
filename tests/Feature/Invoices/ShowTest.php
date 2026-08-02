<?php

use App\Models\Invoice;
use App\Models\User;
use Inertia\Testing\AssertableInertia as Assert;

test('invoice show page is displayed', function () {
    $user = User::factory()->create();
    $invoice = Invoice::factory()->create();

    $this->actingAs($user)
        ->get(route('invoices.show', $invoice))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('invoices/show')
            ->where('invoice.id', $invoice->id),
        );
});

test('guests cannot view an invoice', function () {
    $invoice = Invoice::factory()->create();

    $this->get(route('invoices.show', $invoice))
        ->assertRedirect(route('login'));
});
