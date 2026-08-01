<?php

use App\Models\Quotation;
use App\Models\User;

test('an approved quotation can be marked as sent', function () {
    $user = User::factory()->create();
    $quotation = Quotation::factory()->create(['status' => 'approved']);

    $response = $this->actingAs($user)
        ->patch(route('quotations.progress.update', $quotation), ['progress' => 'sent']);

    $response->assertSessionHasNoErrors();
    $response->assertRedirect(route('quotations.show', $quotation));

    expect($quotation->refresh()->progress)->toBe('sent');
});

test('progress advances from sent to accepted to converted in order', function () {
    $user = User::factory()->create();
    $quotation = Quotation::factory()->create(['status' => 'approved', 'progress' => 'sent']);

    $this->actingAs($user)
        ->patch(route('quotations.progress.update', $quotation), ['progress' => 'accepted'])
        ->assertSessionHasNoErrors();

    expect($quotation->refresh()->progress)->toBe('accepted');

    $this->actingAs($user)
        ->patch(route('quotations.progress.update', $quotation), ['progress' => 'converted'])
        ->assertSessionHasNoErrors();

    expect($quotation->refresh()->progress)->toBe('converted');
});

test('progress stages cannot be skipped', function () {
    $user = User::factory()->create();
    $quotation = Quotation::factory()->create(['status' => 'approved']);

    $this->actingAs($user)
        ->patch(route('quotations.progress.update', $quotation), ['progress' => 'accepted'])
        ->assertSessionHasErrors(['progress']);

    expect($quotation->refresh()->progress)->toBeNull();
});

test('progress cannot be set unless the quotation is approved', function () {
    $user = User::factory()->create();
    $quotation = Quotation::factory()->create(['status' => 'draft']);

    $this->actingAs($user)
        ->patch(route('quotations.progress.update', $quotation), ['progress' => 'sent'])
        ->assertSessionHasErrors(['progress']);

    expect($quotation->refresh()->progress)->toBeNull();
});

test('converted progress has no further transitions', function () {
    $user = User::factory()->create();
    $quotation = Quotation::factory()->create(['status' => 'approved', 'progress' => 'converted']);

    $this->actingAs($user)
        ->patch(route('quotations.progress.update', $quotation), ['progress' => 'sent'])
        ->assertSessionHasErrors(['progress']);
});

test('guests cannot update quotation progress', function () {
    $quotation = Quotation::factory()->create(['status' => 'approved']);

    $this->patch(route('quotations.progress.update', $quotation), ['progress' => 'sent'])
        ->assertRedirect(route('login'));
});
