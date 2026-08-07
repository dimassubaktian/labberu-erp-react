<?php

namespace App\Http\Controllers;

use App\Http\Requests\VendorStoreRequest;
use App\Http\Requests\VendorUpdateRequest;
use App\Models\PurchaseOrder;
use App\Models\Vendor;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class VendorController extends Controller
{
    /**
     * Search vendors for async select pickers.
     */
    public function search(Request $request): JsonResponse
    {
        $query = (string) $request->query('q', '');

        $vendors = Vendor::query()
            ->when($query !== '', function ($builder) use ($query): void {
                $builder->where(function ($inner) use ($query): void {
                    $inner->where('name', 'like', "%{$query}%")
                        ->orWhere('vendor_code', 'like', "%{$query}%");
                });
            })
            ->orderBy('name')
            ->limit(20)
            ->get(['id', 'name', 'vendor_code', 'address', 'phone', 'fax']);

        return response()->json(['data' => $vendors]);
    }

    /**
     * Display a listing of the vendors.
     */
    public function index(Request $request): Response
    {
        $search = (string) $request->query('search', '');

        $vendors = Vendor::query()
            ->when($search !== '', function ($builder) use ($search): void {
                $builder->where(function ($inner) use ($search): void {
                    $inner->where('name', 'like', "%{$search}%")
                        ->orWhere('vendor_code', 'like', "%{$search}%");
                });
            })
            ->orderBy('name')
            ->paginate(15)
            ->withQueryString();

        return Inertia::render('vendors/index', [
            'vendors' => $vendors,
            'filters' => ['search' => $search],
        ]);
    }

    /**
     * Show the form for creating a new vendor.
     */
    public function create(): Response
    {
        return Inertia::render('vendors/create');
    }

    /**
     * Store a newly created vendor.
     */
    public function store(VendorStoreRequest $request): RedirectResponse
    {
        $vendor = Vendor::create($request->validated());

        Inertia::flash('toast', ['type' => 'success', 'message' => __('Vendor created.')]);

        return to_route('vendors.show', $vendor);
    }

    /**
     * Display the specified vendor.
     */
    public function show(Vendor $vendor): Response
    {
        $purchaseOrders = PurchaseOrder::query()
            ->with('currency:id,iso_code,symbol')
            ->where('vendor_id', $vendor->id)
            ->orderByDesc('created_at')
            ->get(['id', 'uuid', 'purchase_order_code', 'status', 'progress', 'grand_total', 'currency_id', 'created_at']);

        return Inertia::render('vendors/show', [
            'vendor' => $vendor,
            'purchaseOrders' => $purchaseOrders,
        ]);
    }

    /**
     * Show the form for editing the specified vendor.
     */
    public function edit(Vendor $vendor): Response
    {
        return Inertia::render('vendors/edit', [
            'vendor' => $vendor,
        ]);
    }

    /**
     * Update the specified vendor.
     */
    public function update(VendorUpdateRequest $request, Vendor $vendor): RedirectResponse
    {
        $vendor->update($request->validated());

        Inertia::flash('toast', ['type' => 'success', 'message' => __('Vendor updated.')]);

        return to_route('vendors.show', $vendor);
    }

    /**
     * Remove the specified vendor.
     */
    public function destroy(Vendor $vendor): RedirectResponse
    {
        $vendor->delete();

        Inertia::flash('toast', ['type' => 'success', 'message' => __('Vendor deleted.')]);

        return to_route('vendors.index');
    }
}
