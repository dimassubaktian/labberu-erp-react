<?php

namespace App\Http\Controllers;

use App\Http\Requests\TaxStoreRequest;
use App\Http\Requests\TaxUpdateRequest;
use App\Models\Tax;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class TaxController extends Controller
{
    /**
     * Display a listing of the taxes.
     */
    public function index(Request $request): Response
    {
        $search = (string) $request->query('search', '');
        $type = (string) $request->query('type', '');

        $taxes = Tax::query()
            ->when($search !== '', function ($builder) use ($search): void {
                $builder->where(function ($q) use ($search): void {
                    $q->where('name', 'like', "%{$search}%")
                        ->orWhere('code', 'like', "%{$search}%");
                });
            })
            ->when($type !== '' && $type !== 'all', fn ($builder) => $builder->where('type', $type))
            ->orderBy('name')
            ->paginate(15)
            ->withQueryString();

        return Inertia::render('taxes/index', [
            'taxes' => $taxes,
            'filters' => ['search' => $search, 'type' => $type],
        ]);
    }

    /**
     * Show the form for creating a new tax.
     */
    public function create(): Response
    {
        return Inertia::render('taxes/create');
    }

    /**
     * Store a newly created tax.
     */
    public function store(TaxStoreRequest $request): RedirectResponse
    {
        Tax::create($request->validated());

        Inertia::flash('toast', ['type' => 'success', 'message' => __('Tax created.')]);

        return to_route('taxes.index');
    }

    /**
     * Display the specified tax.
     */
    public function show(Tax $tax): Response
    {
        return Inertia::render('taxes/show', [
            'tax' => $tax,
        ]);
    }

    /**
     * Show the form for editing the specified tax.
     */
    public function edit(Tax $tax): Response
    {
        return Inertia::render('taxes/edit', [
            'tax' => $tax,
        ]);
    }

    /**
     * Update the specified tax.
     */
    public function update(TaxUpdateRequest $request, Tax $tax): RedirectResponse
    {
        $tax->update($request->validated());

        Inertia::flash('toast', ['type' => 'success', 'message' => __('Tax updated.')]);

        return to_route('taxes.show', $tax);
    }

    /**
     * Remove the specified tax.
     */
    public function destroy(Tax $tax): RedirectResponse
    {
        $tax->delete();

        Inertia::flash('toast', ['type' => 'success', 'message' => __('Tax deleted.')]);

        return to_route('taxes.index');
    }
}
