<?php

use App\Models\PaymentTermTemplate;
use App\Models\User;
use Inertia\Testing\AssertableInertia as Assert;

test('payment term template edit page is displayed', function () {
    $user = User::factory()->create();
    $template = PaymentTermTemplate::factory()->create(['name' => 'Standard Terms']);

    $this->actingAs($user)
        ->get(route('payment-term-templates.edit', $template))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('payment-term-templates/edit')
            ->where('paymentTermTemplate.uuid', $template->uuid)
            ->where('paymentTermTemplate.name', 'Standard Terms'),
        );
});

test('payment term template can be updated', function () {
    $user = User::factory()->create();
    $template = PaymentTermTemplate::factory()->create([
        'name' => 'Standard Terms',
        'content' => '<p>Old content.</p>',
    ]);

    $response = $this->actingAs($user)
        ->put(route('payment-term-templates.update', $template), [
            'name' => 'Updated Terms',
            'content' => '<p>New content.</p>',
        ]);

    $response
        ->assertSessionHasNoErrors()
        ->assertRedirect(route('payment-term-templates.show', $template));

    $this->assertDatabaseHas('payment_term_templates', [
        'id' => $template->id,
        'name' => 'Updated Terms',
        'content' => '<p>New content.</p>',
    ]);
});

test('required fields are validated', function () {
    $user = User::factory()->create();
    $template = PaymentTermTemplate::factory()->create();

    $this->actingAs($user)
        ->put(route('payment-term-templates.update', $template), [])
        ->assertSessionHasErrors(['name', 'content']);
});

test('guests cannot edit or update payment term templates', function () {
    $template = PaymentTermTemplate::factory()->create();

    $this->get(route('payment-term-templates.edit', $template))
        ->assertRedirect(route('login'));

    $this->put(route('payment-term-templates.update', $template), [])
        ->assertRedirect(route('login'));
});
