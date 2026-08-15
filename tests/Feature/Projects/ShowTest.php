<?php

use App\Models\DeliveryOrder;
use App\Models\Invoice;
use App\Models\Project;
use App\Models\PurchaseInvoice;
use App\Models\PurchaseOrder;
use App\Models\Quotation;
use App\Models\User;
use Inertia\Testing\AssertableInertia as Assert;

test('project detail page is displayed', function () {
    $user = User::factory()->create();
    $project = Project::factory()->create(['name' => 'Panel Retrofit']);

    $this->actingAs($user)
        ->get(route('projects.show', $project))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('projects/show')
            ->where('project.uuid', $project->uuid)
            ->where('project.name', 'Panel Retrofit')
            ->where('project.customer.id', $project->customer_id),
        );
});

test('project detail page includes the project\'s quotations', function () {
    $user = User::factory()->create();
    $project = Project::factory()->create();
    $quotation = Quotation::factory()->create(['project_id' => $project->id]);

    $this->actingAs($user)
        ->get(route('projects.show', $project))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('projects/show')
            ->has('quotations', 1)
            ->where('quotations.0.id', $quotation->id)
            ->where('quotations.0.quotation_code', $quotation->quotation_code),
        );
});

test('project detail page includes the project\'s purchase orders', function () {
    $user = User::factory()->create();
    $project = Project::factory()->create();
    $purchaseOrder = PurchaseOrder::factory()->create(['project_id' => $project->id]);

    $this->actingAs($user)
        ->get(route('projects.show', $project))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('projects/show')
            ->has('purchaseOrders', 1)
            ->where('purchaseOrders.0.id', $purchaseOrder->id)
            ->where('purchaseOrders.0.purchase_order_code', $purchaseOrder->purchase_order_code),
        );
});

test('project detail page includes delivery orders raised against the project\'s quotations', function () {
    $user = User::factory()->create();
    $project = Project::factory()->create();
    $quotation = Quotation::factory()->create(['project_id' => $project->id]);
    $deliveryOrder = DeliveryOrder::factory()->create(['quotation_id' => $quotation->id]);

    $this->actingAs($user)
        ->get(route('projects.show', $project))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('projects/show')
            ->has('deliveryOrders', 1)
            ->where('deliveryOrders.0.id', $deliveryOrder->id)
            ->where('deliveryOrders.0.do_code', $deliveryOrder->do_code),
        );
});

test('project detail page includes invoices raised against the project\'s quotations', function () {
    $user = User::factory()->create();
    $project = Project::factory()->create();
    $quotation = Quotation::factory()->create(['project_id' => $project->id]);
    $invoice = Invoice::factory()->create(['quotation_id' => $quotation->id]);

    $this->actingAs($user)
        ->get(route('projects.show', $project))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('projects/show')
            ->has('invoices', 1)
            ->where('invoices.0.id', $invoice->id)
            ->where('invoices.0.invoice_code', $invoice->invoice_code),
        );
});

test('project detail page includes purchase invoices raised against the project\'s purchase orders', function () {
    $user = User::factory()->create();
    $project = Project::factory()->create();
    $purchaseOrder = PurchaseOrder::factory()->create(['project_id' => $project->id]);
    $purchaseInvoice = PurchaseInvoice::factory()->create(['purchase_order_id' => $purchaseOrder->id]);

    $this->actingAs($user)
        ->get(route('projects.show', $project))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('projects/show')
            ->has('purchaseInvoices', 1)
            ->where('purchaseInvoices.0.id', $purchaseInvoice->id)
            ->where('purchaseInvoices.0.purchase_invoice_code', $purchaseInvoice->purchase_invoice_code),
        );
});

test('project detail page is resolved by uuid, not the numeric id', function () {
    $user = User::factory()->create();
    $project = Project::factory()->create();

    $this->actingAs($user)
        ->get(route('projects.show', $project))
        ->assertOk();

    expect(route('projects.show', $project))->toContain($project->uuid);
});

test('trashed projects are not found', function () {
    $user = User::factory()->create();
    $project = Project::factory()->create();
    $project->delete();

    $this->actingAs($user)
        ->get(route('projects.show', $project))
        ->assertNotFound();
});

test('guests cannot view a project', function () {
    $project = Project::factory()->create();

    $this->get(route('projects.show', $project))
        ->assertRedirect(route('login'));
});
