<?php

namespace App\Http\Controllers;

use App\Http\Requests\CurrencyStoreRequest;
use App\Http\Requests\CurrencyUpdateRequest;
use App\Models\Currency;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;

class CurrencyController extends Controller
{
    /**
     * Display a listing of the currencies.
     */
    public function index(Request $request): Response
    {
        $search = (string) $request->query('search', '');
        $status = (string) $request->query('status', '');

        $currencies = Currency::query()
            ->when($search !== '', function ($builder) use ($search): void {
                $builder->where(function ($q) use ($search): void {
                    $q->where('name', 'like', "%{$search}%")
                        ->orWhere('iso_code', 'like', "%{$search}%");
                });
            })
            ->when($status !== '' && $status !== 'all', fn ($builder) => $builder->where('status', $status))
            ->orderBy('name')
            ->paginate(15)
            ->withQueryString();

        return Inertia::render('currencies/index', [
            'currencies' => $currencies,
            'filters' => ['search' => $search, 'status' => $status],
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
        $data = $request->validated();

        DB::transaction(function () use ($data): void {
            if ($data['base_currency']) {
                Currency::query()->where('base_currency', true)->update(['base_currency' => false]);
            }

            Currency::create($data);
        });

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
        $data = $request->validated();

        DB::transaction(function () use ($data, $currency): void {
            if ($data['base_currency']) {
                Currency::query()->where('id', '!=', $currency->id)->where('base_currency', true)->update(['base_currency' => false]);
            }

            $currency->update($data);
        });

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
