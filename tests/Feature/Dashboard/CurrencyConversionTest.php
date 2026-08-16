<?php

use App\Models\Currency;
use App\Models\Invoice;
use App\Models\Project;
use App\Models\PurchaseOrder;
use App\Models\Quotation;
use App\Models\User;
use Spatie\Permission\Models\Role;

test('project contract value is stored converted to the base currency', function () {
    $usd = Currency::factory()->create(['iso_code' => 'USD', 'base_currency' => false]);
    $quotation = Quotation::factory()->create([
        'status' => 'approved',
        'currency_id' => $usd->id,
        'exchange_rate' => 16_000,
        'total' => 100,
    ]);

    $quotation->project->recomputeActualValues($quotation);

    expect((float) $quotation->project->refresh()->actual_contract_value)->toBe(1_600_000.0);
});

test('clearing the approved quotation clears the contract value', function () {
    $project = Project::factory()->create(['actual_contract_value' => 5_000]);

    $project->recomputeActualValues(null);

    expect($project->refresh()->actual_contract_value)->toBeNull();
});

test('management revenue and spend convert foreign currency documents at their own rates', function () {
    $user = User::factory()->create();
    $user->assignRole(Role::findOrCreate('Manager', 'web'));

    $usd = Currency::factory()->create(['iso_code' => 'USD', 'base_currency' => false]);
    $quotation = Quotation::factory()->create(['currency_id' => $usd->id, 'exchange_rate' => 16_000]);

    Invoice::factory()->create([
        'quotation_id' => $quotation->id,
        'status' => 'issued',
        'subtotal' => 100,
        'total' => 100,
    ]);

    PurchaseOrder::factory()->create([
        'status' => 'approved',
        'currency_id' => $usd->id,
        'exchange_rate' => 16_000,
        'grand_total' => 50,
    ]);

    $this->actingAs($user)
        ->get(route('dashboard'))
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->where('management.kpis.total_revenue', fn ($v) => (float) $v === 1_600_000.0)
            ->where('management.kpis.total_spend', fn ($v) => (float) $v === 800_000.0),
        );
});

test('finance totals convert foreign currency invoices at the quotation rate', function () {
    $user = User::factory()->create();
    $user->assignRole(Role::findOrCreate('Finance', 'web'));

    $usd = Currency::factory()->create(['iso_code' => 'USD', 'base_currency' => false]);
    $foreign = Quotation::factory()->create(['currency_id' => $usd->id, 'exchange_rate' => 16_000]);
    $local = Quotation::factory()->create(['exchange_rate' => 1]);

    Invoice::factory()->create([
        'quotation_id' => $foreign->id,
        'status' => 'issued',
        'subtotal' => 100,
        'total' => 100,
    ]);
    Invoice::factory()->create([
        'quotation_id' => $local->id,
        'status' => 'issued',
        'subtotal' => 400_000,
        'total' => 400_000,
    ]);

    $this->actingAs($user)
        ->get(route('dashboard'))
        ->assertOk()
        ->assertInertia(fn ($page) => $page->where(
            'finance.kpis.total_invoiced',
            fn ($total) => (float) $total === 2_000_000.0,
        ));
});
