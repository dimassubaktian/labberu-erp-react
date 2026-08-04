<?php

namespace App\Http\Controllers;

use App\Http\Requests\ProjectStoreRequest;
use App\Http\Requests\ProjectUpdateRequest;
use App\Models\Project;
use App\Models\Workforce;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class ProjectController extends Controller
{
    /**
     * Search projects for async select pickers.
     */
    public function search(Request $request): JsonResponse
    {
        $query = (string) $request->query('q', '');

        $projects = Project::query()
            ->with('customer:id,name')
            ->when($query !== '', function ($builder) use ($query): void {
                $builder->where(function ($inner) use ($query): void {
                    $inner->where('name', 'like', "%{$query}%")
                        ->orWhere('project_code', 'like', "%{$query}%");
                });
            })
            ->orderByDesc('request_date')
            ->limit(20)
            ->get(['id', 'uuid', 'name', 'project_code', 'customer_id']);

        return response()->json(['data' => $projects]);
    }

    /**
     * List the quotations belonging to the given project, for dependent pickers.
     */
    public function quotations(Project $project): JsonResponse
    {
        $quotations = $project->quotations()
            ->orderByDesc('version_major')
            ->orderByDesc('version_minor')
            ->get(['id', 'uuid', 'quotation_code', 'version_major', 'version_minor', 'status', 'is_current']);

        return response()->json(['data' => $quotations]);
    }

    /**
     * Display a listing of the projects.
     */
    public function index(Request $request): Response
    {
        $search = $request->string('search')->trim()->toString();
        $status = $request->string('status')->toString();
        $priority = $request->string('priority')->toString();
        $sort = $request->string('sort', 'desc')->toString() === 'asc' ? 'asc' : 'desc';

        $projects = Project::query()
            ->with('customer')
            ->when($search !== '', function ($query) use ($search): void {
                $query->where(function ($inner) use ($search): void {
                    $inner->where('name', 'like', "%{$search}%")
                        ->orWhere('project_code', 'like', "%{$search}%");
                });
            })
            ->when($status !== '', fn ($query) => $query->where('status', $status))
            ->when($priority !== '', fn ($query) => $query->where('priority', $priority))
            ->orderBy('request_date', $sort)
            ->paginate(15)
            ->withQueryString();

        return Inertia::render('projects/index', [
            'projects' => $projects,
            'filters' => [
                'search' => $search,
                'status' => $status,
                'priority' => $priority,
                'sort' => $sort,
            ],
        ]);
    }

    /**
     * Show the form for creating a new project.
     */
    public function create(): Response
    {
        $workforces = Workforce::query()
            ->where('status', 'active')
            ->orderBy('full_name')
            ->get(['id', 'full_name']);

        return Inertia::render('projects/create', [
            'workforces' => $workforces,
        ]);
    }

    /**
     * Store a newly created project.
     */
    public function store(ProjectStoreRequest $request): RedirectResponse
    {
        $project = Project::create($request->validated());

        Inertia::flash('toast', ['type' => 'success', 'message' => __('Project created.')]);

        return to_route('projects.show', $project);
    }

    /**
     * Display the specified project.
     */
    public function show(Project $project): Response
    {
        $project->load('customer', 'personInCharge', 'attachments.uploader');

        $quotations = $project->quotations()
            ->with('currency')
            ->orderByDesc('created_at')
            ->get(['id', 'uuid', 'quotation_code', 'version_major', 'version_minor', 'status', 'is_current', 'valid_until', 'total', 'currency_id']);

        $purchaseOrders = $project->purchaseOrders()
            ->with('vendor:id,name', 'currency')
            ->orderByDesc('created_at')
            ->get(['id', 'uuid', 'purchase_order_code', 'status', 'grand_total', 'vendor_id', 'currency_id']);

        return Inertia::render('projects/show', [
            'project' => $project,
            'quotations' => $quotations,
            'purchaseOrders' => $purchaseOrders,
        ]);
    }

    /**
     * Show the form for editing the specified project.
     */
    public function edit(Project $project): Response
    {
        $project->load('customer:id,name,customer_code');

        $workforces = Workforce::query()
            ->where(function ($query) use ($project): void {
                $query->where('status', 'active')
                    ->orWhere('id', $project->person_in_charge_id);
            })
            ->orderBy('full_name')
            ->get(['id', 'full_name']);

        return Inertia::render('projects/edit', [
            'project' => $project,
            'workforces' => $workforces,
        ]);
    }

    /**
     * Update the specified project.
     */
    public function update(ProjectUpdateRequest $request, Project $project): RedirectResponse
    {
        $project->update($request->validated());

        Inertia::flash('toast', ['type' => 'success', 'message' => __('Project updated.')]);

        return to_route('projects.show', $project);
    }

    /**
     * Remove the specified project.
     */
    public function destroy(Project $project): RedirectResponse
    {
        $project->delete();

        Inertia::flash('toast', ['type' => 'success', 'message' => __('Project deleted.')]);

        return to_route('projects.index');
    }
}
