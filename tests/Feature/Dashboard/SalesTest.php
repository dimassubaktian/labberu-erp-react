<?php

use App\Models\Project;
use App\Models\Quotation;
use App\Models\User;
use Illuminate\Support\Facades\Date;
use Spatie\Permission\PermissionRegistrar;

afterEach(function () {
    Date::setTestNow();
});

test('sales dashboard prioritizes stalled work and summarizes the pipeline', function () {
    Date::setTestNow('2026-09-04 12:00:00');

    $user = User::factory()->create();

    Project::factory()->create([
        'name' => 'Unquoted Calibration',
        'status' => 'new',
        'sales_status' => null,
        'request_date' => now()->subDays(15),
        'estimate_contract_value' => 5_000_000,
    ]);

    $approvalProject = Project::factory()->create([
        'status' => 'planning',
        'sales_status' => 'quoting',
        'request_date' => now()->subMonth(),
        'actual_contract_value' => 2_000_000,
    ]);
    Quotation::factory()->create([
        'project_id' => $approvalProject->id,
        'status' => 'request_for_approval',
        'valid_until' => now()->addDays(20),
        'total' => 2_000_000,
        'exchange_rate' => 1,
        'updated_at' => now()->subDays(4),
    ]);

    $followUpProject = Project::factory()->create([
        'status' => 'planning',
        'sales_status' => 'sent',
        'request_date' => now()->subMonths(2),
        'actual_contract_value' => 3_000_000,
    ]);
    $expiringQuotation = Quotation::factory()->create([
        'project_id' => $followUpProject->id,
        'status' => 'approved',
        'progress' => 'sent',
        'valid_until' => now()->addDays(3),
        'total' => 3_000_000,
        'exchange_rate' => 1,
        'updated_at' => now()->subDays(10),
    ]);

    $signedProject = Project::factory()->create([
        'status' => 'completed',
        'sales_status' => 'signed',
        'request_date' => now()->subMonths(3),
        'actual_contract_value' => 4_000_000,
    ]);
    Quotation::factory()->create([
        'project_id' => $signedProject->id,
        'status' => 'approved',
        'progress' => 'signed',
        'total' => 4_000_000,
        'exchange_rate' => 1,
    ]);

    $this->actingAs($user)
        ->get(route('dashboard'))
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->where('sales.year', 2026)
            ->where('sales.kpis.open_opportunities', 3)
            ->where('sales.kpis.pipeline_value', fn ($value) => (float) $value === 10_000_000.0)
            ->where('sales.kpis.signed_value', fn ($value) => (float) $value === 4_000_000.0)
            ->where('sales.kpis.needs_attention', 3)
            ->where('sales.action_summary.no_quotation', 1)
            ->where('sales.action_summary.approval', 1)
            ->where('sales.action_summary.follow_up', 1)
            ->where('sales.action_summary.at_risk', 1)
            ->where('sales.action_items.0.uuid', $expiringQuotation->uuid)
            ->where('sales.action_items.0.category', 'Quotation expiring soon')
            ->has('sales.pipeline', 5)
            ->has('sales.recent_wins', 1),
        );
});

test('sales dashboard requires access to both projects and quotations', function () {
    $user = User::factory()->create();

    $this->actingAs($user);
    $user->syncPermissions(['projects.view']);
    app(PermissionRegistrar::class)->forgetCachedPermissions();

    $this->get(route('dashboard'))
        ->assertOk()
        ->assertInertia(fn ($page) => $page->missing('sales'));
});

test('quotation changes invalidate cached sales figures', function () {
    Date::setTestNow('2026-09-04 12:00:00');

    $user = User::factory()->create();
    $project = Project::factory()->create([
        'status' => 'planning',
        'sales_status' => 'quoting',
        'request_date' => now(),
    ]);

    Quotation::factory()->create([
        'project_id' => $project->id,
        'status' => 'draft',
        'valid_until' => now()->addMonth(),
    ]);

    $this->actingAs($user)
        ->get(route('dashboard'))
        ->assertInertia(fn ($page) => $page->where('sales.action_summary.draft', 1));

    Quotation::factory()->create([
        'project_id' => $project->id,
        'status' => 'draft',
        'valid_until' => now()->addMonth(),
    ]);

    $this->get(route('dashboard'))
        ->assertInertia(fn ($page) => $page->where('sales.action_summary.draft', 2));
});
