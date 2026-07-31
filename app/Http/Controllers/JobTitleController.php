<?php

namespace App\Http\Controllers;

use App\Http\Requests\JobTitleStoreRequest;
use App\Http\Requests\JobTitleUpdateRequest;
use App\Models\JobTitle;
use Illuminate\Http\RedirectResponse;
use Inertia\Inertia;
use Inertia\Response;

class JobTitleController extends Controller
{
    /**
     * Display a listing of the job titles.
     */
    public function index(): Response
    {
        $jobTitles = JobTitle::query()
            ->orderBy('name')
            ->paginate(15)
            ->withQueryString();

        return Inertia::render('job-titles/index', [
            'jobTitles' => $jobTitles,
        ]);
    }

    /**
     * Show the form for creating a new job title.
     */
    public function create(): Response
    {
        return Inertia::render('job-titles/create');
    }

    /**
     * Store a newly created job title.
     */
    public function store(JobTitleStoreRequest $request): RedirectResponse
    {
        JobTitle::create($request->validated());

        Inertia::flash('toast', ['type' => 'success', 'message' => __('Job title created.')]);

        return to_route('job-titles.index');
    }

    /**
     * Display the specified job title.
     */
    public function show(JobTitle $jobTitle): Response
    {
        $workforces = $jobTitle->workforces()
            ->select(['id', 'uuid', 'employee_code', 'full_name', 'email', 'status'])
            ->orderBy('full_name')
            ->get();

        return Inertia::render('job-titles/show', [
            'jobTitle' => $jobTitle,
            'workforces' => $workforces,
        ]);
    }

    /**
     * Show the form for editing the specified job title.
     */
    public function edit(JobTitle $jobTitle): Response
    {
        return Inertia::render('job-titles/edit', [
            'jobTitle' => $jobTitle,
        ]);
    }

    /**
     * Update the specified job title.
     */
    public function update(JobTitleUpdateRequest $request, JobTitle $jobTitle): RedirectResponse
    {
        $jobTitle->update($request->validated());

        Inertia::flash('toast', ['type' => 'success', 'message' => __('Job title updated.')]);

        return to_route('job-titles.show', $jobTitle);
    }

    /**
     * Remove the specified job title.
     */
    public function destroy(JobTitle $jobTitle): RedirectResponse
    {
        if ($this->hasWorkforce($jobTitle)) {
            Inertia::flash('toast', ['type' => 'error', 'message' => __('This job title is assigned to workforce members and cannot be deleted.')]);

            return back();
        }

        $jobTitle->delete();

        Inertia::flash('toast', ['type' => 'success', 'message' => __('Job title deleted.')]);

        return to_route('job-titles.index');
    }

    /**
     * Determine whether the job title is currently assigned to any workforce member.
     */
    private function hasWorkforce(JobTitle $jobTitle): bool
    {
        return $jobTitle->workforces()->exists();
    }
}
