<?php

use App\Models\Customer;
use App\Models\Project;
use App\Models\Quotation;
use App\Models\User;

test('quotation index page renders for authenticated user', function () {
    $user = User::factory()->create();

    $this->actingAs($user)
        ->get(route('quotations.index'))
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('quotations/index')
            ->has('quotations')
            ->has('filters')
        );
});

test('search filters by quotation code', function () {
    $user = User::factory()->create();

    $match = Quotation::factory()->create(['quotation_code' => 'LAB-Q001-01-ABC', 'thread_number' => 1, 'is_current' => true]);
    $other = Quotation::factory()->create(['quotation_code' => 'LAB-Q002-01-XYZ', 'thread_number' => 2, 'is_current' => true]);

    $this->actingAs($user)
        ->get(route('quotations.index', ['search' => 'Q001']))
        ->assertInertia(fn ($page) => $page
            ->has('quotations.data', 1)
            ->where('quotations.data.0.quotation_code', 'LAB-Q001-01-ABC')
        );
});

test('search filters by project name', function () {
    $user = User::factory()->create();

    $projectA = Project::factory()->create(['name' => 'Automation System']);
    $projectB = Project::factory()->create(['name' => 'Other Project']);

    Quotation::factory()->create(['project_id' => $projectA->id, 'is_current' => true]);
    Quotation::factory()->create(['project_id' => $projectB->id, 'is_current' => true]);

    $this->actingAs($user)
        ->get(route('quotations.index', ['search' => 'Automation']))
        ->assertInertia(fn ($page) => $page->has('quotations.data', 1));
});

test('search filters by customer name', function () {
    $user = User::factory()->create();

    $customerA = Customer::factory()->create(['name' => 'PT Maju Bersama']);
    $customerB = Customer::factory()->create(['name' => 'CV Lain Saja']);

    $projectA = Project::factory()->create(['customer_id' => $customerA->id]);
    $projectB = Project::factory()->create(['customer_id' => $customerB->id]);

    Quotation::factory()->create(['project_id' => $projectA->id, 'is_current' => true]);
    Quotation::factory()->create(['project_id' => $projectB->id, 'is_current' => true]);

    $this->actingAs($user)
        ->get(route('quotations.index', ['search' => 'Maju']))
        ->assertInertia(fn ($page) => $page->has('quotations.data', 1));
});

test('status filter returns only matching quotations', function () {
    $user = User::factory()->create();

    Quotation::factory()->create(['status' => 'draft', 'is_current' => true]);
    Quotation::factory()->create(['status' => 'approved', 'is_current' => true]);
    Quotation::factory()->create(['status' => 'approved', 'is_current' => true]);

    $this->actingAs($user)
        ->get(route('quotations.index', ['status' => 'approved']))
        ->assertInertia(fn ($page) => $page->has('quotations.data', 2));
});

test('only current quotations are listed', function () {
    $user = User::factory()->create();

    Quotation::factory()->create(['is_current' => true]);
    Quotation::factory()->create(['is_current' => false]);

    $this->actingAs($user)
        ->get(route('quotations.index'))
        ->assertInertia(fn ($page) => $page->has('quotations.data', 1));
});

test('filters prop is passed back to the page', function () {
    $user = User::factory()->create();

    $this->actingAs($user)
        ->get(route('quotations.index', ['search' => 'test', 'status' => 'draft', 'sort' => 'higher_amount']))
        ->assertInertia(fn ($page) => $page
            ->where('filters.search', 'test')
            ->where('filters.status', 'draft')
            ->where('filters.sort', 'higher_amount')
        );
});

test('invalid sort value defaults to latest', function () {
    $user = User::factory()->create();

    $this->actingAs($user)
        ->get(route('quotations.index', ['sort' => 'malicious_value']))
        ->assertOk()
        ->assertInertia(fn ($page) => $page->where('filters.sort', 'latest'));
});
