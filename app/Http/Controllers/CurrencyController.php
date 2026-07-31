<?php

namespace App\Http\Controllers;

use App\Http\Requests\CurrencyStoreRequest;
use App\Http\Requests\CurrencyUpdateRequest;
use App\Models\Currency;
use Illuminate\Http\RedirectResponse;
use Inertia\Inertia;
use Inertia\Response;

class CurrencyController extends Controller
{
    /**
     * Display a listing of the currencies.
     */
    public function index(): Response
    {
        $currencies = Currency::query()
            ->orderBy('name')
            ->paginate(15)
            ->withQueryString();

        return Inertia::render('currencies/index', [
            'currencies' => $currencies,
        ]);
    }

    /**
     * Show the form for creating a new currency.
     */
    public function create(): Response
    {
        return Inertia::render('currencies/create');
    }

    /**
     * Store a newly created currency.
     */
    public function store(CurrencyStoreRequest $request): RedirectResponse
    {
        Currency::create($request->validated());

        Inertia::flash('toast', ['type' => 'success', 'message' => __('Currency created.')]);

        return to_route('currencies.index');
    }

    /**
     * Display the specified currency.
     */
    public function show(Currency $currency): Response
    {
        return Inertia::render('currencies/show', [
            'currency' => $currency,
        ]);
    }

    /**
     * Show the form for editing the specified currency.
     */
    public function edit(Currency $currency): Response
    {
        return Inertia::render('currencies/edit', [
            'currency' => $currency,
        ]);
    }

    /**
     * Update the specified currency.
     */
    public function update(CurrencyUpdateRequest $request, Currency $currency): RedirectResponse
    {
        $currency->update($request->validated());

        Inertia::flash('toast', ['type' => 'success', 'message' => __('Currency updated.')]);

        return to_route('currencies.show', $currency);
    }

    /**
     * Remove the specified currency.
     */
    public function destroy(Currency $currency): RedirectResponse
    {
        $currency->delete();

        Inertia::flash('toast', ['type' => 'success', 'message' => __('Currency deleted.')]);

        return to_route('currencies.index');
    }
}
