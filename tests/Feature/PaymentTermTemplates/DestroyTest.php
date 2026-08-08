<?php

use App\Models\PaymentTermTemplate;
use App\Models\User;

test('payment term template can be deleted', function () {
    $user = User::factory()->create();
    $template = PaymentTermTemplate::factory()->create();

    $response = $this->actingAs($user)
        ->delete(route('payment-term-templates.destroy', $template));

    $response->assertRedirect(route('payment-term-templates.index'));

    $this->assertSoftDeleted($template);
});

test('guests cannot delete payment term templates', function () {
    $template = PaymentTermTemplate::factory()->create();

    $this->delete(route('payment-term-templates.destroy', $template))
        ->assertRedirect(route('login'));

    $this->assertNotSoftDeleted($template);
});
