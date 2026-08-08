<?php

namespace App\Http\Controllers;

use App\Http\Requests\PaymentTermTemplateStoreRequest;
use App\Http\Requests\PaymentTermTemplateUpdateRequest;
use App\Models\PaymentTermTemplate;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class PaymentTermTemplateController extends Controller
{
    /**
     * Display a listing of the payment term templates.
     */
    public function index(Request $request): Response
    {
        $search = (string) $request->query('search', '');

        $paymentTermTemplates = PaymentTermTemplate::query()
            ->when($search !== '', fn ($builder) => $builder->where('name', 'like', "%{$search}%"))
            ->orderBy('name')
            ->paginate(15)
            ->withQueryString();

        return Inertia::render('payment-term-templates/index', [
            'paymentTermTemplates' => $paymentTermTemplates,
            'filters' => ['search' => $search],
        ]);
    }

    /**
     * Show the form for creating a new payment term template.
     */
    public function create(): Response
    {
        return Inertia::render('payment-term-templates/create');
    }

    /**
     * Store a newly created payment term template.
     */
    public function store(PaymentTermTemplateStoreRequest $request): RedirectResponse
    {
        PaymentTermTemplate::create($request->validated());

        Inertia::flash('toast', ['type' => 'success', 'message' => __('Payment term template created.')]);

        return to_route('payment-term-templates.index');
    }

    /**
     * Display the specified payment term template.
     */
    public function show(PaymentTermTemplate $paymentTermTemplate): Response
    {
        return Inertia::render('payment-term-templates/show', [
            'paymentTermTemplate' => $paymentTermTemplate,
        ]);
    }

    /**
     * Show the form for editing the specified payment term template.
     */
    public function edit(PaymentTermTemplate $paymentTermTemplate): Response
    {
        return Inertia::render('payment-term-templates/edit', [
            'paymentTermTemplate' => $paymentTermTemplate,
        ]);
    }

    /**
     * Update the specified payment term template.
     */
    public function update(PaymentTermTemplateUpdateRequest $request, PaymentTermTemplate $paymentTermTemplate): RedirectResponse
    {
        $paymentTermTemplate->update($request->validated());

        Inertia::flash('toast', ['type' => 'success', 'message' => __('Payment term template updated.')]);

        return to_route('payment-term-templates.show', $paymentTermTemplate);
    }

    /**
     * Remove the specified payment term template.
     */
    public function destroy(PaymentTermTemplate $paymentTermTemplate): RedirectResponse
    {
        $paymentTermTemplate->delete();

        Inertia::flash('toast', ['type' => 'success', 'message' => __('Payment term template deleted.')]);

        return to_route('payment-term-templates.index');
    }
}
