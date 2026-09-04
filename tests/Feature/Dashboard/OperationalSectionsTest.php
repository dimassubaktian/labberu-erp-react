<?php

use App\Models\Invoice;
use App\Models\InvoicePayment;
use App\Models\Project;
use App\Models\PurchaseOrder;
use App\Models\Quotation;
use App\Models\User;
use App\Models\Workforce;
use Illuminate\Support\Facades\Date;
use Spatie\Permission\Models\Role;

afterEach(function () {
    Date::setTestNow();
});

test('finance dashboard prioritizes upcoming collections and excludes cancelled payments', function () {
    Date::setTestNow('2026-09-04 12:00:00');

    $user = User::factory()->create();
    $user->assignRole(Role::findOrCreate('Finance', 'web'));
    $quotation = Quotation::factory()->create(['exchange_rate' => 1]);
    $invoice = Invoice::factory()->create([
        'quotation_id' => $quotation->id,
        'status' => 'issued',
        'payment_status' => 'partially_paid',
        'due_date' => now()->subDays(4),
        'subtotal' => 1_000_000,
        'total' => 1_000_000,
    ]);

    InvoicePayment::create([
        'invoice_id' => $invoice->id,
        'amount' => 250_000,
        'payment_date' => now(),
        'recorded_by' => $user->id,
    ]);
    InvoicePayment::create([
        'invoice_id' => $invoice->id,
        'amount' => 100_000,
        'payment_date' => now(),
        'recorded_by' => $user->id,
        'cancelled_at' => now(),
        'cancel_reason' => 'Duplicate entry',
        'cancelled_by' => $user->id,
    ]);

    $this->actingAs($user)
        ->get(route('dashboard'))
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->where('finance.kpis.total_collected', fn ($value) => (float) $value === 250_000.0)
            ->where('finance.collection_summary.overdue', 1)
            ->where('finance.collection_summary.partially_paid', 1)
            ->where('finance.collection_actions.0.uuid', $invoice->uuid)
            ->where('finance.collection_actions.0.days_from_due', -4)
            ->where('finance.collection_actions.0.outstanding', fn ($value) => (float) $value === 750_000.0),
        );
});

test('purchasing dashboard prioritizes overdue vendor deliveries', function () {
    Date::setTestNow('2026-09-04 12:00:00');

    $user = User::factory()->create();
    $user->assignRole(Role::findOrCreate('Procurement', 'web'));

    PurchaseOrder::factory()->create([
        'status' => 'issued',
        'updated_at' => now()->subDays(4),
    ]);
    $overduePurchaseOrder = PurchaseOrder::factory()->create([
        'status' => 'approved',
        'progress' => 'sent',
        'delivery_date' => now()->subDays(3),
        'grand_total' => 2_000_000,
        'exchange_rate' => 1,
    ]);

    $this->actingAs($user)
        ->get(route('dashboard'))
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->where('purchasing.action_summary.approval', 1)
            ->where('purchasing.action_summary.in_transit', 1)
            ->where('purchasing.action_summary.overdue', 1)
            ->where('purchasing.action_items.0.uuid', $overduePurchaseOrder->uuid)
            ->where('purchasing.action_items.0.category', 'Delivery overdue'),
        );
});

test('my projects are ordered by overdue status and priority', function () {
    Date::setTestNow('2026-09-04 12:00:00');

    $user = User::factory()->create();
    $workforce = Workforce::factory()->create(['user_id' => $user->id]);
    $urgentProject = Project::factory()->create([
        'person_in_charge_id' => $workforce->id,
        'priority' => 'urgent',
        'end_date' => now()->addWeek(),
    ]);
    $overdueProject = Project::factory()->create([
        'person_in_charge_id' => $workforce->id,
        'priority' => 'low',
        'end_date' => now()->subDay(),
    ]);

    $this->actingAs($user)
        ->get(route('dashboard'))
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->where('staff.my_projects.0.uuid', $overdueProject->uuid)
            ->where('staff.my_projects.0.days_until_due', -1)
            ->where('staff.my_projects.1.uuid', $urgentProject->uuid),
        );
});
