<?php

use App\Models\ActivityLog;
use App\Models\Invoice;
use App\Models\User;
use Inertia\Testing\AssertableInertia as Assert;

test('activity log index lists recorded entries', function () {
    $user = User::factory()->create();
    $invoice = Invoice::factory()->create(['status' => 'draft']);

    ActivityLog::record('invoice.issued', $invoice, "Issued invoice {$invoice->invoice_code}.");

    $this->actingAs($user)
        ->get(route('activity-logs.index'))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('activity-logs/index')
            ->where('activityLogs.data.0.action', 'invoice.issued'),
        );
});

test('activity log index can be searched', function () {
    $user = User::factory()->create();
    $invoice = Invoice::factory()->create(['status' => 'draft']);

    ActivityLog::record('invoice.issued', $invoice, "Issued invoice {$invoice->invoice_code}.");
    ActivityLog::record('quotation.approved', $invoice, 'Approved quotation Q-1.');

    $this->actingAs($user)
        ->get(route('activity-logs.index', ['search' => 'invoice.issued']))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('activity-logs/index')
            ->has('activityLogs.data', 1),
        );
});

test('a user without the activity-logs permission cannot view the log', function () {
    $user = User::factory()->create();
    $this->actingAs($user);
    $user->syncPermissions([]);

    $this->get(route('activity-logs.index'))->assertForbidden();
});

test('guests cannot view the activity log', function () {
    $this->get(route('activity-logs.index'))->assertRedirect(route('login'));
});
