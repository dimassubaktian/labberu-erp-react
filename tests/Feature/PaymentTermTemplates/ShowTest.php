<?php

use App\Models\PaymentTermTemplate;
use App\Models\User;
use Inertia\Testing\AssertableInertia as Assert;

test('payment term template detail page is displayed', function () {
    $user = User::factory()->create();
    $template = PaymentTermTemplate::factory()->create(['name' => 'Standard Terms']);

    $this->actingAs($user)
        ->get(route('payment-term-templates.show', $template))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('payment-term-templates/show')
            ->where('paymentTermTemplate.uuid', $template->uuid)
            ->where('paymentTermTemplate.name', 'Standard Terms'),
        );
});

test('payment term template detail page is resolved by uuid, not the numeric id', function () {
    $user = User::factory()->create();
    $template = PaymentTermTemplate::factory()->create();

    $this->actingAs($user)
        ->get(route('payment-term-templates.show', $template))
        ->assertOk();

    expect(route('payment-term-templates.show', $template))->toContain($template->uuid);
});

test('trashed payment term templates are not found', function () {
    $user = User::factory()->create();
    $template = PaymentTermTemplate::factory()->create();
    $template->delete();

    $this->actingAs($user)
        ->get(route('payment-term-templates.show', $template))
        ->assertNotFound();
});

test('guests cannot view a payment term template', function () {
    $template = PaymentTermTemplate::factory()->create();

    $this->get(route('payment-term-templates.show', $template))
        ->assertRedirect(route('login'));
});
