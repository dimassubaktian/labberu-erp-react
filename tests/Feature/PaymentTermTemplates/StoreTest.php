<?php

use App\Models\User;
use Inertia\Testing\AssertableInertia as Assert;

test('payment term template create page is displayed', function () {
    $user = User::factory()->create();

    $this->actingAs($user)
        ->get(route('payment-term-templates.create'))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('payment-term-templates/create'),
        );
});

test('payment term template can be created', function () {
    $user = User::factory()->create();

    $response = $this->actingAs($user)
        ->post(route('payment-term-templates.store'), [
            'name' => 'Standard Equipment Terms',
            'content' => '<p>Down payment 40%.</p>',
        ]);

    $response
        ->assertSessionHasNoErrors()
        ->assertRedirect(route('payment-term-templates.index'));

    $this->assertDatabaseHas('payment_term_templates', [
        'name' => 'Standard Equipment Terms',
        'content' => '<p>Down payment 40%.</p>',
    ]);
});

test('required fields are validated', function () {
    $user = User::factory()->create();

    $this->actingAs($user)
        ->post(route('payment-term-templates.store'), [])
        ->assertSessionHasErrors(['name', 'content']);
});

test('guests cannot create payment term templates', function () {
    $this->get(route('payment-term-templates.create'))
        ->assertRedirect(route('login'));

    $this->post(route('payment-term-templates.store'), [])
        ->assertRedirect(route('login'));
});
