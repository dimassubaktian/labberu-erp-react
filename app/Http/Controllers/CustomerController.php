<?php

namespace App\Http\Controllers;

use App\Http\Requests\CustomerStoreRequest;
use App\Http\Requests\CustomerUpdateRequest;
use App\Models\Customer;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class CustomerController extends Controller
{
    /**
     * Search customers for async select pickers.
     */
    public function search(Request $request): JsonResponse
    {
        $query = (string) $request->query('q', '');

        $customers = Customer::query()
            ->when($query !== '', function ($builder) use ($query): void {
                $builder->where(function ($inner) use ($query): void {
                    $inner->where('name', 'like', "%{$query}%")
                        ->orWhere('customer_code', 'like', "%{$query}%");
                });
            })
            ->orderBy('name')
            ->limit(20)
            ->get(['id', 'name', 'customer_code']);

        return response()->json(['data' => $customers]);
    }

    /**
     * Display a listing of the customers.
     */
    public function index(Request $request): Response
    {
        $search = (string) $request->query('search', '');

        $customers = Customer::query()
            ->when($search !== '', function ($builder) use ($search): void {
                $builder->where(function ($inner) use ($search): void {
                    $inner->where('name', 'like', "%{$search}%")
                        ->orWhere('customer_code', 'like', "%{$search}%");
                });
            })
            ->orderBy('name')
            ->paginate(15)
            ->withQueryString();

        return Inertia::render('customers/index', [
            'customers' => $customers,
            'filters' => ['search' => $search],
        ]);
    }

    /**
     * Show the form for creating a new customer.
     */
    public function create(): Response
    {
        return Inertia::render('customers/create');
    }

    /**
     * Store a newly created customer.
     */
    public function store(CustomerStoreRequest $request): RedirectResponse
    {
        $customer = Customer::create($request->validated());

        Inertia::flash('toast', ['type' => 'success', 'message' => __('Customer created.')]);

        return to_route('customers.show', $customer);
    }

    /**
     * Store a newly created customer from another module's quick-create dialog, returning it as JSON.
     */
    public function quickStore(CustomerStoreRequest $request): JsonResponse
    {
        $customer = Customer::create($request->validated());

        return response()->json(['data' => $customer->only(['id', 'name', 'customer_code'])], 201);
    }

    /**
     * Display the specified customer.
     */
    public function show(Customer $customer): Response
    {
        $customer->load(['projects' => function ($query): void {
            $query->orderByDesc('request_date')
                ->select(['id', 'uuid', 'project_code', 'name', 'status', 'sales_status', 'po_status', 'billing_status', 'priority', 'request_date', 'customer_id']);
        }]);

        return Inertia::render('customers/show', [
            'customer' => $customer,
        ]);
    }

    /**
     * Show the form for editing the specified customer.
     */
    public function edit(Customer $customer): Response
    {
        return Inertia::render('customers/edit', [
            'customer' => $customer,
        ]);
    }

    /**
     * Update the specified customer.
     */
    public function update(CustomerUpdateRequest $request, Customer $customer): RedirectResponse
    {
        $customer->update($request->validated());

        Inertia::flash('toast', ['type' => 'success', 'message' => __('Customer updated.')]);

        return to_route('customers.show', $customer);
    }

    /**
     * Remove the specified customer.
     */
    public function destroy(Customer $customer): RedirectResponse
    {
        $customer->delete();

        Inertia::flash('toast', ['type' => 'success', 'message' => __('Customer deleted.')]);

        return to_route('customers.index');
    }
}
