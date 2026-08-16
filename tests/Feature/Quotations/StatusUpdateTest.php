<?php

use App\Models\Bom;
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

test('draft quotation can be cancelled with a reason', function () {
    $user = User::factory()->create();
    $quotation = Quotation::factory()->create(['status' => 'draft']);

    $response = $this->actingAs($user)
        ->patch(route('quotations.status.update', $quotation), [
            'status' => 'cancelled',
            'cancel_reason' => 'Customer withdrew the request.',
        ]);

    $response->assertSessionHasNoErrors();
    $response->assertRedirect(route('quotations.show', $quotation));

    $quotation->refresh();
    expect($quotation->status)->toBe('cancelled');
    expect($quotation->cancel_reason)->toBe('Customer withdrew the request.');
});

test('cancelling a quotation without a reason fails validation', function () {
    $user = User::factory()->create();
    $quotation = Quotation::factory()->create(['status' => 'draft']);

    $this->actingAs($user)
        ->patch(route('quotations.status.update', $quotation), [
            'status' => 'cancelled',
        ])
        ->assertSessionHasErrors(['cancel_reason']);

    expect($quotation->refresh()->status)->toBe('draft');
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

test('quotation pending approval can be cancelled back to draft', function () {
    $user = User::factory()->create();
    $quotation = Quotation::factory()->create(['status' => 'request_for_approval']);

    $this->actingAs($user)->patch(route('quotations.status.update', $quotation), [
        'status' => 'draft',
    ]);

    expect($quotation->refresh()->status)->toBe('draft');
});

test('quotation pending approval can no longer be cancelled directly', function () {
    $user = User::factory()->create();
    $quotation = Quotation::factory()->create(['status' => 'request_for_approval']);

    $this->actingAs($user)
        ->patch(route('quotations.status.update', $quotation), [
            'status' => 'cancelled',
        ])
        ->assertSessionHasErrors(['status']);

    expect($quotation->refresh()->status)->toBe('request_for_approval');
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

test('approving a quotation requires the quotations.approval permission', function () {
    $user = User::factory()->create();
    $quotation = Quotation::factory()->create(['status' => 'request_for_approval']);

    $this->actingAs($user);
    $user->syncPermissions(['quotations.status.update']);

    $this->patch(route('quotations.status.update', $quotation), ['status' => 'approved'])
        ->assertForbidden();

    expect($quotation->refresh()->status)->toBe('request_for_approval');
});

test('rejecting a quotation requires the quotations.approval permission', function () {
    $user = User::factory()->create();
    $quotation = Quotation::factory()->create(['status' => 'request_for_approval']);

    $this->actingAs($user);
    $user->syncPermissions(['quotations.status.update']);

    $this->patch(route('quotations.status.update', $quotation), ['status' => 'rejected'])
        ->assertForbidden();

    expect($quotation->refresh()->status)->toBe('request_for_approval');
});

test('quotations.approval permission is not required for non-approval status transitions', function () {
    $user = User::factory()->create();
    $quotation = Quotation::factory()->create(['status' => 'draft']);

    $this->actingAs($user);
    $user->syncPermissions(['quotations.status.update']);

    $this->patch(route('quotations.status.update', $quotation), ['status' => 'request_for_approval'])
        ->assertSessionHasNoErrors();

    expect($quotation->refresh()->status)->toBe('request_for_approval');
});

test('a user with the quotations.approval permission can approve and reject quotations', function () {
    $user = User::factory()->create();
    $quotation = Quotation::factory()->create(['status' => 'request_for_approval']);

    $this->actingAs($user);
    $user->syncPermissions(['quotations.status.update', 'quotations.approval']);

    $this->patch(route('quotations.status.update', $quotation), ['status' => 'approved'])
        ->assertSessionHasNoErrors();

    expect($quotation->refresh()->status)->toBe('approved');
});

test('approving a quotation sets actual_contract_value and leaves actual_cost to the purchase invoices', function () {
    $user = User::factory()->create();
    $quotation = Quotation::factory()->create([
        'status' => 'request_for_approval',
        'total' => 2_000_000,
    ]);
    Bom::create([
        'quotation_id' => $quotation->id,
        'main_cost' => 800_000,
        'overhead_percentage' => 0,
        'overhead_cost' => 0,
        'total_cost' => 800_000,
        'selling_percentage' => 0,
        'selling_cost' => 0,
    ]);

    $this->actingAs($user)->patch(route('quotations.status.update', $quotation), ['status' => 'approved']);

    $project = $quotation->project->refresh();
    expect((float) $project->actual_contract_value)->toBe(2_000_000.0);
    // The BOM total is planned cost, not spend — actual_cost only moves when a vendor bills.
    expect($project->actual_cost)->toBeNull();
});

test('approving a quotation without a bom sets actual_contract_value but leaves actual_cost null', function () {
    $user = User::factory()->create();
    $quotation = Quotation::factory()->create([
        'status' => 'request_for_approval',
        'total' => 1_500_000,
    ]);

    $this->actingAs($user)->patch(route('quotations.status.update', $quotation), ['status' => 'approved']);

    $project = $quotation->project->refresh();
    expect((float) $project->actual_contract_value)->toBe(1_500_000.0);
    expect($project->actual_cost)->toBeNull();
});

test('voiding an approved quotation clears actual_contract_value but keeps money already spent', function () {
    $user = User::factory()->create();
    $quotation = Quotation::factory()->create([
        'status' => 'approved',
        'total' => 2_000_000,
    ]);
    $quotation->project->update([
        'actual_contract_value' => 2_000_000,
        'actual_cost' => 800_000,
    ]);

    $this->actingAs($user)->patch(route('quotations.status.update', $quotation), ['status' => 'voided']);

    $project = $quotation->project->refresh();
    expect($project->actual_contract_value)->toBeNull();
    // Voiding the quotation does not un-spend what vendors already billed.
    expect((float) $project->actual_cost)->toBe(800_000.0);
});
