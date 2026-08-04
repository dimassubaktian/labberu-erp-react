<?php

use App\Models\Customer;
use App\Models\Project;
use App\Models\User;
use App\Models\Workforce;
use Inertia\Testing\AssertableInertia as Assert;

test('project create page is displayed', function () {
    $user = User::factory()->create();

    $this->actingAs($user)
        ->get(route('projects.create'))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('projects/create'),
        );
});

test('project can be created', function () {
    $user = User::factory()->create();
    $customer = Customer::factory()->create(['name' => 'Zeta Corp']);
    $workforce = Workforce::factory()->create();

    $response = $this->actingAs($user)
        ->post(route('projects.store'), [
            'name' => 'Panel Retrofit',
            'customer_id' => $customer->id,
            'request_date' => '2026-07-01',
            'person_in_charge_id' => $workforce->id,
            'description' => 'Retrofit the main distribution panel.',
            'status' => 'planning',
            'priority' => 'high',
            'start_date' => '2026-07-15',
            'end_date' => '2026-08-15',
            'estimate_contract_value' => '150000000.00',
            'estimate_cost' => '90000000.00',
        ]);

    $response->assertSessionHasNoErrors();
    $response->assertRedirect(route('projects.show', Project::sole()));

    $this->assertDatabaseHas('projects', [
        'name' => 'Panel Retrofit',
        'customer_id' => $customer->id,
        'person_in_charge_id' => $workforce->id,
        'status' => 'planning',
        'priority' => 'high',
    ]);
});

test('a project can be created with the new status', function () {
    $user = User::factory()->create();
    $customer = Customer::factory()->create();

    $response = $this->actingAs($user)
        ->post(route('projects.store'), [
            'name' => 'Panel Retrofit',
            'customer_id' => $customer->id,
            'request_date' => '2026-07-01',
            'status' => 'new',
            'priority' => 'medium',
        ]);

    $response->assertSessionHasNoErrors();
    $this->assertDatabaseHas('projects', ['name' => 'Panel Retrofit', 'status' => 'new']);
});

test('project code is generated using the year, month, and customer code', function () {
    $user = User::factory()->create();
    $customer = Customer::factory()->create(['name' => 'Zeta Corp']);

    $this->actingAs($user)->post(route('projects.store'), [
        'name' => 'Panel Retrofit',
        'customer_id' => $customer->id,
        'request_date' => '2026-07-01',
        'status' => 'planning',
        'priority' => 'high',
    ]);

    $project = Project::sole();
    $expectedCode = sprintf('LAB-%s%s001-%s', now()->format('y'), now()->format('m'), $customer->customer_code);

    expect($project->project_code)->toBe($expectedCode);
});

test('only required fields are needed', function () {
    $user = User::factory()->create();
    $customer = Customer::factory()->create();

    $response = $this->actingAs($user)
        ->post(route('projects.store'), [
            'name' => 'Minimal Project',
            'customer_id' => $customer->id,
            'request_date' => '2026-07-01',
            'status' => 'planning',
            'priority' => 'medium',
        ]);

    $response->assertSessionHasNoErrors();
    $response->assertRedirect(route('projects.show', Project::sole()));

    $this->assertDatabaseHas('projects', ['name' => 'Minimal Project']);
});

test('required fields are validated', function () {
    $user = User::factory()->create();

    $this->actingAs($user)
        ->post(route('projects.store'), [])
        ->assertSessionHasErrors(['name', 'customer_id', 'request_date', 'status', 'priority']);
});

test('customer must exist', function () {
    $user = User::factory()->create();

    $this->actingAs($user)
        ->post(route('projects.store'), [
            'name' => 'Panel Retrofit',
            'customer_id' => 999,
            'request_date' => '2026-07-01',
            'status' => 'planning',
            'priority' => 'medium',
        ])
        ->assertSessionHasErrors(['customer_id']);
});

test('end date must not be before start date', function () {
    $user = User::factory()->create();
    $customer = Customer::factory()->create();

    $this->actingAs($user)
        ->post(route('projects.store'), [
            'name' => 'Panel Retrofit',
            'customer_id' => $customer->id,
            'request_date' => '2026-07-01',
            'status' => 'planning',
            'priority' => 'medium',
            'start_date' => '2026-08-01',
            'end_date' => '2026-07-01',
        ])
        ->assertSessionHasErrors(['end_date']);
});

test('guests cannot create projects', function () {
    $this->get(route('projects.create'))
        ->assertRedirect(route('login'));

    $this->post(route('projects.store'), [])
        ->assertRedirect(route('login'));
});
