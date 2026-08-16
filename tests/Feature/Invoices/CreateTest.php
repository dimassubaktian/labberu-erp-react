<?php

use App\Models\PaymentTermTemplate;
use App\Models\Quotation;
use App\Models\User;
use Inertia\Testing\AssertableInertia as Assert;

test('invoice create page lists the payment term templates', function () {
    $user = User::factory()->create();
    PaymentTermTemplate::factory()->create(['name' => 'Net 30']);

    $this->actingAs($user)
        ->get(route('invoices.create'))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('invoices/create')
            ->where('initialQuotation', null)
            ->where('paymentTermTemplates.0.name', 'Net 30'),
        );
});

test('invoice create page prefills the payment terms from the given quotation', function () {
    $user = User::factory()->create();
    $template = PaymentTermTemplate::factory()->create();
    $quotation = Quotation::factory()->create([
        'status' => 'approved',
        'payment_term_template_id' => $template->id,
        'payment_terms_html' => '<p>50% down payment, 50% on delivery.</p>',
    ]);

    $this->actingAs($user)
        ->get(route('invoices.create', ['quotation' => $quotation->uuid]))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('invoices/create')
            ->where('initialQuotation.payment_term_template_id', $template->id)
            ->where('initialQuotation.payment_terms_html', '<p>50% down payment, 50% on delivery.</p>'),
        );
});

test('guests cannot view the create page', function () {
    $this->get(route('invoices.create'))
        ->assertRedirect(route('login'));
});
