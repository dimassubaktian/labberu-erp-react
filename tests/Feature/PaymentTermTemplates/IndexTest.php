<?php

use App\Models\PaymentTermTemplate;
use App\Models\User;
use Inertia\Testing\AssertableInertia as Assert;

test('payment term templates index page is displayed', function () {
    $user = User::factory()->create();
    PaymentTermTemplate::factory()->create(['name' => 'Standard Terms']);
    PaymentTermTemplate::factory()->create(['name' => 'Extended Terms']);

    $this->actingAs($user)
        ->get(route('payment-term-templates.index'))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('payment-term-templates/index')
            ->has('paymentTermTemplates.data', 2),
        );
});

test('trashed payment term templates are not listed', function () {
    $user = User::factory()->create();
    PaymentTermTemplate::factory()->create();
    PaymentTermTemplate::factory()->create()->delete();

    $this->actingAs($user)
        ->get(route('payment-term-templates.index'))
        ->assertInertia(fn (Assert $page) => $page
            ->has('paymentTermTemplates.data', 1),
        );
});

test('payment term templates can be searched by name', function () {
    $user = User::factory()->create();
    PaymentTermTemplate::factory()->create(['name' => 'Standard Terms']);
    PaymentTermTemplate::factory()->create(['name' => 'Extended Terms']);

    $this->actingAs($user)
        ->get(route('payment-term-templates.index', ['search' => 'Standard']))
        ->assertInertia(fn (Assert $page) => $page
            ->has('paymentTermTemplates.data', 1),
        );
});

test('guests cannot view payment term templates', function () {
    $this->get(route('payment-term-templates.index'))
        ->assertRedirect(route('login'));
});
