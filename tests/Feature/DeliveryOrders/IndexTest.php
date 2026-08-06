<?php

use App\Models\Customer;
use App\Models\DeliveryOrder;
use App\Models\Project;
use App\Models\Quotation;
use App\Models\User;

test('delivery order index page renders for authenticated user', function () {
    $user = User::factory()->create();

    $this->actingAs($user)
        ->get(route('delivery-orders.index'))
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('delivery-orders/index')
            ->has('deliveryOrders')
            ->has('filters')
        );
});

test('guests cannot view delivery orders index', function () {
    $this->get(route('delivery-orders.index'))
        ->assertRedirect(route('login'));
});

test('search filters by do_code', function () {
    $user = User::factory()->create();

    $match = DeliveryOrder::factory()->create(['do_code' => 'LAB-DO24001-ABC']);
    DeliveryOrder::factory()->create(['do_code' => 'LAB-DO24002-XYZ']);

    $this->actingAs($user)
        ->get(route('delivery-orders.index', ['search' => 'DO24001']))
        ->assertInertia(fn ($page) => $page
            ->has('deliveryOrders.data', 1)
            ->where('deliveryOrders.data.0.do_code', $match->do_code)
        );
});

test('search filters by customer name', function () {
    $user = User::factory()->create();

    $customerA = Customer::factory()->create(['name' => 'PT Maju Bersama']);
    $customerB = Customer::factory()->create(['name' => 'CV Lain Saja']);

    $projectA = Project::factory()->create(['customer_id' => $customerA->id]);
    $projectB = Project::factory()->create(['customer_id' => $customerB->id]);

    $quotationA = Quotation::factory()->create(['project_id' => $projectA->id]);
    $quotationB = Quotation::factory()->create(['project_id' => $projectB->id]);

    DeliveryOrder::factory()->create(['quotation_id' => $quotationA->id]);
    DeliveryOrder::factory()->create(['quotation_id' => $quotationB->id]);

    $this->actingAs($user)
        ->get(route('delivery-orders.index', ['search' => 'Maju']))
        ->assertInertia(fn ($page) => $page->has('deliveryOrders.data', 1));
});

test('status filter returns only matching delivery orders', function () {
    $user = User::factory()->create();

    DeliveryOrder::factory()->create(['status' => 'draft']);
    DeliveryOrder::factory()->create(['status' => 'confirmed']);
    DeliveryOrder::factory()->create(['status' => 'confirmed']);

    $this->actingAs($user)
        ->get(route('delivery-orders.index', ['status' => 'confirmed']))
        ->assertInertia(fn ($page) => $page->has('deliveryOrders.data', 2));
});

test('sort delivery_date_asc returns oldest delivery date first', function () {
    $user = User::factory()->create();

    $older = DeliveryOrder::factory()->create(['delivery_date' => '2024-01-01']);
    $newer = DeliveryOrder::factory()->create(['delivery_date' => '2024-06-01']);

    $this->actingAs($user)
        ->get(route('delivery-orders.index', ['sort' => 'delivery_date_asc']))
        ->assertInertia(fn ($page) => $page
            ->where('deliveryOrders.data.0.id', $older->id)
        );
});

test('sort delivery_date_desc returns newest delivery date first', function () {
    $user = User::factory()->create();

    $older = DeliveryOrder::factory()->create(['delivery_date' => '2024-01-01']);
    $newer = DeliveryOrder::factory()->create(['delivery_date' => '2024-06-01']);

    $this->actingAs($user)
        ->get(route('delivery-orders.index', ['sort' => 'delivery_date_desc']))
        ->assertInertia(fn ($page) => $page
            ->where('deliveryOrders.data.0.id', $newer->id)
        );
});

test('filters prop is echoed back to the page', function () {
    $user = User::factory()->create();

    $this->actingAs($user)
        ->get(route('delivery-orders.index', ['search' => 'test', 'status' => 'draft', 'sort' => 'delivery_date_asc']))
        ->assertInertia(fn ($page) => $page
            ->where('filters.search', 'test')
            ->where('filters.status', 'draft')
            ->where('filters.sort', 'delivery_date_asc')
        );
});

test('invalid sort value defaults to delivery_date_desc', function () {
    $user = User::factory()->create();

    $this->actingAs($user)
        ->get(route('delivery-orders.index', ['sort' => 'malicious_value']))
        ->assertOk()
        ->assertInertia(fn ($page) => $page->where('filters.sort', 'delivery_date_desc'));
});
