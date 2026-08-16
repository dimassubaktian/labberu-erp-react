<?php

use App\Models\Invoice;
use App\Models\PaymentTermTemplate;
use App\Models\User;

test('payment terms can be updated on a draft invoice', function () {
    $user = User::factory()->create();
    $invoice = Invoice::factory()->create(['status' => 'draft']);
    $template = PaymentTermTemplate::factory()->create();

    $this->actingAs($user)
        ->patch(route('invoices.payment-terms.update', $invoice), [
            'payment_term_template_id' => $template->id,
            'payment_terms_html' => '<p>Net 30 days.</p>',
        ])
        ->assertSessionHasNoErrors()
        ->assertRedirect(route('invoices.show', $invoice));

    $invoice->refresh();
    expect($invoice->payment_term_template_id)->toBe($template->id);
    expect($invoice->payment_terms_html)->toBe('<p>Net 30 days.</p>');
});

test('payment terms can still be updated after the invoice is issued', function () {
    $user = User::factory()->create();
    $template = PaymentTermTemplate::factory()->create();
    $invoice = Invoice::factory()->create([
        'status' => 'issued',
        'issued_at' => now(),
        'payment_terms_html' => '<p>Old terms.</p>',
    ]);

    $this->actingAs($user)
        ->patch(route('invoices.payment-terms.update', $invoice), [
            'payment_term_template_id' => $template->id,
            'payment_terms_html' => '<p>Corrected terms.</p>',
        ])
        ->assertSessionHasNoErrors();

    $invoice->refresh();
    expect($invoice->status)->toBe('issued');
    expect($invoice->payment_terms_html)->toBe('<p>Corrected terms.</p>');
});

test('payment terms can be cleared', function () {
    $user = User::factory()->create();
    $invoice = Invoice::factory()->create([
        'payment_term_template_id' => PaymentTermTemplate::factory()->create()->id,
        'payment_terms_html' => '<p>Net 30 days.</p>',
    ]);

    $this->actingAs($user)
        ->patch(route('invoices.payment-terms.update', $invoice), [])
        ->assertSessionHasNoErrors();

    $invoice->refresh();
    expect($invoice->payment_term_template_id)->toBeNull();
    expect($invoice->payment_terms_html)->toBeNull();
});

test('an unknown payment term template is rejected', function () {
    $user = User::factory()->create();
    $invoice = Invoice::factory()->create();

    $this->actingAs($user)
        ->patch(route('invoices.payment-terms.update', $invoice), [
            'payment_term_template_id' => 999_999,
        ])
        ->assertSessionHasErrors('payment_term_template_id');
});

test('updating payment terms requires the payment-terms.update permission', function () {
    $user = User::factory()->create();
    $invoice = Invoice::factory()->create();

    $this->actingAs($user);
    $user->syncPermissions(['invoices.view', 'invoices.update']);

    $this->patch(route('invoices.payment-terms.update', $invoice), [])
        ->assertForbidden();
});

test('guests cannot update payment terms', function () {
    $invoice = Invoice::factory()->create();

    $this->patch(route('invoices.payment-terms.update', $invoice), [])
        ->assertRedirect(route('login'));
});
