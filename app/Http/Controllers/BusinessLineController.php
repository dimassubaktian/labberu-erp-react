<?php

namespace App\Http\Controllers;

use App\Http\Requests\BusinessLineStoreRequest;
use App\Http\Requests\BusinessLineUpdateRequest;
use App\Models\BusinessLine;
use Illuminate\Http\RedirectResponse;
use Inertia\Inertia;
use Inertia\Response;

class BusinessLineController extends Controller
{
    /**
     * Display a listing of the business lines.
     */
    public function index(): Response
    {
        $businessLines = BusinessLine::query()
            ->orderBy('name')
            ->paginate(15)
            ->withQueryString();

        return Inertia::render('business-lines/index', [
            'businessLines' => $businessLines,
        ]);
    }

    /**
     * Show the form for creating a new business line.
     */
    public function create(): Response
    {
        return Inertia::render('business-lines/create');
    }

    /**
     * Store a newly created business line.
     */
    public function store(BusinessLineStoreRequest $request): RedirectResponse
    {
        BusinessLine::create($request->validated());

        Inertia::flash('toast', ['type' => 'success', 'message' => __('Business line created.')]);

        return to_route('business-lines.index');
    }

    /**
     * Display the specified business line.
     */
    public function show(BusinessLine $businessLine): Response
    {
        $projects = $businessLine->projects()
            ->with('customer:id,name')
            ->orderByDesc('request_date')
            ->get(['id', 'uuid', 'project_code', 'name', 'customer_id', 'status', 'priority']);

        return Inertia::render('business-lines/show', [
            'businessLine' => $businessLine,
            'projects' => $projects,
        ]);
    }

    /**
     * Show the form for editing the specified business line.
     */
    public function edit(BusinessLine $businessLine): Response
    {
        return Inertia::render('business-lines/edit', [
            'businessLine' => $businessLine,
        ]);
    }

    /**
     * Update the specified business line.
     */
    public function update(BusinessLineUpdateRequest $request, BusinessLine $businessLine): RedirectResponse
    {
        $businessLine->update($request->validated());

        Inertia::flash('toast', ['type' => 'success', 'message' => __('Business line updated.')]);

        return to_route('business-lines.show', $businessLine);
    }

    /**
     * Remove the specified business line.
     */
    public function destroy(BusinessLine $businessLine): RedirectResponse
    {
        if ($businessLine->projects()->exists()) {
            Inertia::flash('toast', ['type' => 'error', 'message' => __('This business line has projects assigned and cannot be deleted.')]);

            return back();
        }

        $businessLine->delete();

        Inertia::flash('toast', ['type' => 'success', 'message' => __('Business line deleted.')]);

        return to_route('business-lines.index');
    }
}
