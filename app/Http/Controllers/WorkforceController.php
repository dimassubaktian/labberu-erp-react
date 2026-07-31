<?php

namespace App\Http\Controllers;

use App\Http\Requests\WorkforceStoreRequest;
use App\Http\Requests\WorkforceUpdateRequest;
use App\Models\JobTitle;
use App\Models\Workforce;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;
use Inertia\Response;
use Symfony\Component\HttpFoundation\StreamedResponse;

class WorkforceController extends Controller
{
    /**
     * Display a listing of the workforce members.
     */
    public function index(): Response
    {
        $workforces = Workforce::query()
            ->with('jobTitle:id,name')
            ->orderBy('full_name')
            ->paginate(15)
            ->withQueryString();

        return Inertia::render('workforces/index', [
            'workforces' => $workforces,
        ]);
    }

    /**
     * Show the form for creating a new workforce member.
     */
    public function create(): Response
    {
        $jobTitles = JobTitle::query()
            ->where('status', 'active')
            ->orderBy('name')
            ->get(['id', 'name']);

        return Inertia::render('workforces/create', [
            'jobTitles' => $jobTitles,
        ]);
    }

    /**
     * Store a newly created workforce member.
     */
    public function store(WorkforceStoreRequest $request): RedirectResponse
    {
        $data = $request->validated();

        if ($request->hasFile('photo')) {
            $data['photo'] = $request->file('photo')->store('workforce-photos', 'local');
        }

        Workforce::create($data);

        Inertia::flash('toast', ['type' => 'success', 'message' => __('Workforce member created.')]);

        return to_route('workforces.index');
    }

    /**
     * Display the specified workforce member.
     */
    public function show(Workforce $workforce): Response
    {
        $workforce->load('jobTitle:id,name');

        return Inertia::render('workforces/show', [
            'workforce' => $workforce,
        ]);
    }

    /**
     * Show the form for editing the specified workforce member.
     */
    public function edit(Workforce $workforce): Response
    {
        $jobTitles = JobTitle::query()
            ->where(function ($query) use ($workforce): void {
                $query->where('status', 'active')
                    ->orWhere('id', $workforce->job_title_id);
            })
            ->orderBy('name')
            ->get(['id', 'name']);

        return Inertia::render('workforces/edit', [
            'workforce' => $workforce,
            'jobTitles' => $jobTitles,
        ]);
    }

    /**
     * Update the specified workforce member.
     */
    public function update(WorkforceUpdateRequest $request, Workforce $workforce): RedirectResponse
    {
        $data = $request->validated();

        if ($request->hasFile('photo')) {
            if ($workforce->photo) {
                Storage::disk('local')->delete($workforce->photo);
            }

            $data['photo'] = $request->file('photo')->store('workforce-photos', 'local');
        }

        $workforce->update($data);

        Inertia::flash('toast', ['type' => 'success', 'message' => __('Workforce member updated.')]);

        return to_route('workforces.show', $workforce);
    }

    /**
     * Remove the specified workforce member.
     */
    public function destroy(Workforce $workforce): RedirectResponse
    {
        $workforce->delete();

        Inertia::flash('toast', ['type' => 'success', 'message' => __('Workforce member deleted.')]);

        return to_route('workforces.index');
    }

    /**
     * Stream the workforce member's photo to authenticated users only.
     */
    public function photo(Workforce $workforce): StreamedResponse
    {
        abort_unless($workforce->photo && Storage::disk('local')->exists($workforce->photo), 404);

        return Storage::disk('local')->response($workforce->photo);
    }
}
