<?php

use App\Models\Invoice;
use App\Models\InvoicePayment;
use App\Models\Quotation;
use App\Models\User;
use Spatie\Permission\Models\Role;

function financeUser(): User
{
    $user = User::factory()->create();
    $user->assignRole(Role::findOrCreate('Finance', 'web'));

    return $user;
}

function issuedInvoice(float $total): Invoice
{
    return Invoice::factory()->create([
        'quotation_id' => Quotation::factory()->create(['exchange_rate' => 1])->id,
        'status' => 'issued',
        'subtotal' => $total,
        'total' => $total,
    ]);
}

test('issuing an invoice invalidates the cached finance totals', function () {
    $user = financeUser();
    issuedInvoice(1_000_000);

    $this->actingAs($user)
        ->get(route('dashboard'))
        ->assertOk()
        ->assertInertia(fn ($page) => $page->where(
            'finance.kpis.total_invoiced',
            fn ($total) => (float) $total === 1_000_000.0,
        ));

    // A newly issued invoice must show up on the next load rather than the previously cached figure.
    issuedInvoice(500_000);

    $this->actingAs($user)
        ->get(route('dashboard'))
        ->assertOk()
        ->assertInertia(fn ($page) => $page->where(
            'finance.kpis.total_invoiced',
            fn ($total) => (float) $total === 1_500_000.0,
        ));
});

test('recording a payment invalidates the cached collected total', function () {
    $user = financeUser();
    $invoice = issuedInvoice(1_000_000);

    $this->actingAs($user)
        ->get(route('dashboard'))
        ->assertOk()
        ->assertInertia(fn ($page) => $page->where(
            'finance.kpis.total_collected',
            fn ($total) => (float) $total === 0.0,
        ));

    InvoicePayment::create([
        'invoice_id' => $invoice->id,
        'amount' => 400_000,
        'payment_date' => now(),
        'recorded_by' => $user->id,
    ]);

    $this->actingAs($user)
        ->get(route('dashboard'))
        ->assertOk()
        ->assertInertia(fn ($page) => $page->where(
            'finance.kpis.total_collected',
            fn ($total) => (float) $total === 400_000.0,
        ));
});
