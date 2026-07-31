<?php

use App\Models\Customer;
use App\Models\Project;
use App\Models\User;
use Inertia\Testing\AssertableInertia as Assert;

test('customer detail page is displayed', function () {
    $user = User::factory()->create();
    $customer = Customer::factory()->create(['name' => 'Nusalink Bridge']);

    $this->actingAs($user)
        ->get(route('customers.show', $customer))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('customers/show')
            ->where('customer.uuid', $customer->uuid)
            ->where('customer.name', 'Nusalink Bridge'),
        );
});

test('customer detail page is resolved by uuid, not the numeric id', function () {
    $user = User::factory()->create();
    $customer = Customer::factory()->create();

    $this->actingAs($user)
        ->get(route('customers.show', $customer))
        ->assertOk();

    expect(route('customers.show', $customer))->toContain($customer->uuid);
});

test('trashed customers are not found', function () {
    $user = User::factory()->create();
    $customer = Customer::factory()->create();
    $customer->delete();

    $this->actingAs($user)
        ->get(route('customers.show', $customer))
        ->assertNotFound();
});

test('customer detail page lists related projects', function () {
    $user = User::factory()->create();
    $customer = Customer::factory()->create();
    $project = Project::factory()->create(['customer_id' => $customer->id]);
    Project::factory()->create();

    $this->actingAs($user)
        ->get(route('customers.show', $customer))
        ->assertInertia(fn (Assert $page) => $page
            ->has('customer.projects', 1)
            ->where('customer.projects.0.uuid', $project->uuid),
        );
});

test('guests cannot view a customer', function () {
    $customer = Customer::factory()->create();

    $this->get(route('customers.show', $customer))
        ->assertRedirect(route('login'));
});
