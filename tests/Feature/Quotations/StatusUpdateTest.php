<?php

use App\Models\Quotation;
use App\Models\User;

test('draft quotation can be submitted for approval', function () {
    $user = User::factory()->create();
    $quotation = Quotation::factory()->create(['status' => 'draft']);

    $response = $this->actingAs($user)
        ->patch(route('quotations.status.update', $quotation), [
            'status' => 'request_for_approval',
        ]);

    $response->assertSessionHasNoErrors();
    $response->assertRedirect(route('quotations.show', $quotation));

    expect($quotation->refresh()->status)->toBe('request_for_approval');
});

test('quotation pending approval can be approved and records the approver', function () {
    $user = User::factory()->create();
    $quotation = Quotation::factory()->create(['status' => 'request_for_approval']);

    $this->actingAs($user)->patch(route('quotations.status.update', $quotation), [
        'status' => 'approved',
    ]);

    $quotation->refresh();

    expect($quotation->status)->toBe('approved');
    expect($quotation->approved_by)->toBe($user->id);
    expect($quotation->approved_at)->not->toBeNull();
});

test('quotation pending approval can be rejected', function () {
    $user = User::factory()->create();
    $quotation = Quotation::factory()->create(['status' => 'request_for_approval']);

    $this->actingAs($user)->patch(route('quotations.status.update', $quotation), [
        'status' => 'rejected',
    ]);

    expect($quotation->refresh()->status)->toBe('rejected');
    expect($quotation->refresh()->approved_by)->toBeNull();
});

test('approved quotation can be voided', function () {
    $user = User::factory()->create();
    $quotation = Quotation::factory()->create(['status' => 'approved']);

    $this->actingAs($user)->patch(route('quotations.status.update', $quotation), [
        'status' => 'voided',
    ]);

    expect($quotation->refresh()->status)->toBe('voided');
});

test('invalid status transitions are rejected', function () {
    $user = User::factory()->create();
    $quotation = Quotation::factory()->create(['status' => 'draft']);

    $this->actingAs($user)
        ->patch(route('quotations.status.update', $quotation), [
            'status' => 'approved',
        ])
        ->assertSessionHasErrors(['status']);

    expect($quotation->refresh()->status)->toBe('draft');
});

test('terminal statuses have no further transitions', function () {
    $user = User::factory()->create();
    $quotation = Quotation::factory()->create(['status' => 'voided']);

    $this->actingAs($user)
        ->patch(route('quotations.status.update', $quotation), [
            'status' => 'draft',
        ])
        ->assertSessionHasErrors(['status']);
});

test('guests cannot update quotation status', function () {
    $quotation = Quotation::factory()->create();

    $this->patch(route('quotations.status.update', $quotation), ['status' => 'request_for_approval'])
        ->assertRedirect(route('login'));
});
