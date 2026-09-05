<?php

namespace App\Http\Controllers;

use App\Http\Requests\ProjectCancelRequest;
use App\Http\Requests\ProjectStoreRequest;
use App\Http\Requests\ProjectUpdateRequest;
use App\Http\Requests\ProjectVoidRequest;
use App\Models\BusinessLine;
use App\Models\Customer;
use App\Models\EquipmentAssignment;
use App\Models\EquipmentCalibration;
use App\Models\Project;
use App\Models\Workforce;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
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
            ->with('customer', 'businessLine:id,name')
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
    public function create(Request $request): Response
    {
        $validated = $request->validate([
            'customer' => ['nullable', 'uuid', Rule::exists(Customer::class, 'uuid')],
        ]);

        $workforces = Workforce::query()
            ->where('status', 'active')
            ->orderBy('full_name')
            ->get(['id', 'full_name']);

        $businessLines = BusinessLine::query()
            ->where('status', 'active')
            ->orderBy('name')
            ->get(['id', 'name']);

        return Inertia::render('projects/create', [
            'customer' => isset($validated['customer'])
                ? Customer::query()
                    ->where('uuid', $validated['customer'])
                    ->first(['id', 'name', 'customer_code'])
                : null,
            'workforces' => $workforces,
            'businessLines' => $businessLines,
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

        // Full checkout/return history for this project, not just what's currently assigned, so
        // returned equipment doesn't just disappear from the page. Compliance only means anything
        // for still-open assignments; a returned tool's compliance at the time doesn't matter now.
        $equipmentAssignments = EquipmentAssignment::query()
            ->where('project_id', $project->id)
            ->with([
                'equipment:id,uuid,equipment_code,name,category,calibration_required',
                'custodian:id,full_name',
                'creator:id,name',
            ])
            ->orderByDesc('checked_out_at')
            ->get();

        // Latest calibration date per equipment for the still-open assignments, fetched in a single
        // grouped query so the compliance check below doesn't run one query per assignment.
        $lastCalibratedAt = EquipmentCalibration::query()
            ->whereIn('equipment_id', $equipmentAssignments
                ->whereNull('returned_at')
                ->pluck('equipment_id')
                ->unique())
            ->selectRaw('equipment_id, MAX(calibration_date) as last_calibrated_at')
            ->groupBy('equipment_id')
            ->pluck('last_calibrated_at', 'equipment_id');

        $equipmentAssignments->each(function (EquipmentAssignment $assignment) use ($project, $lastCalibratedAt): void {
            $assignment->setAttribute(
                'calibration_compliant',
                $assignment->returned_at === null
                    ? $assignment->equipment->calibrationRecencySatisfiedBy(
                        $lastCalibratedAt->get($assignment->equipment_id),
                        $project->equipment_calibration_max_age_months,
                    )
                    : null,
            );
        });

        $quotations = $project->quotations()
            ->with('currency')
            ->orderByDesc('created_at')
            ->get(['id', 'uuid', 'quotation_code', 'version_major', 'version_minor', 'status', 'is_current', 'valid_until', 'total', 'currency_id']);

        $purchaseOrders = $project->purchaseOrders()
            ->with('vendor:id,name', 'currency')
            ->orderByDesc('created_at')
            ->get(['id', 'uuid', 'purchase_order_code', 'status', 'grand_total', 'vendor_id', 'currency_id']);

        $deliveryOrders = $project->deliveryOrders()
            ->with('quotation:id,quotation_code,version_major,version_minor')
            ->orderByDesc('delivery_orders.created_at')
            ->get(['delivery_orders.id', 'delivery_orders.uuid', 'delivery_orders.do_code', 'delivery_orders.status', 'delivery_orders.delivery_date', 'delivery_orders.quotation_id']);

        $invoices = $project->invoices()
            ->with('quotation:id,quotation_code,version_major,version_minor')
            ->orderByDesc('invoices.created_at')
            ->get(['invoices.id', 'invoices.uuid', 'invoices.invoice_code', 'invoices.status', 'invoices.payment_status', 'invoices.invoice_date', 'invoices.total', 'invoices.quotation_id']);

        $purchaseInvoices = $project->purchaseInvoices()
            ->with('purchaseOrder:id,purchase_order_code,currency_id', 'purchaseOrder.currency')
            ->orderByDesc('purchase_invoices.created_at')
            ->get(['purchase_invoices.id', 'purchase_invoices.uuid', 'purchase_invoices.purchase_invoice_code', 'purchase_invoices.status', 'purchase_invoices.payment_status', 'purchase_invoices.invoice_date', 'purchase_invoices.total', 'purchase_invoices.purchase_order_id']);

        // Planned cost lives on the approved quotation's BOM; actual_cost on the project is what
        // vendors have billed, so the two together give the cost variance.
        $plannedCost = $project->quotations()
            ->where('status', 'approved')
            ->where('is_current', true)
            ->with('bom:id,quotation_id,total_cost')
            ->first()?->bom?->total_cost;

        return Inertia::render('projects/show', [
            'project' => $project,
            'plannedCost' => $plannedCost,
            'quotations' => $quotations,
            'purchaseOrders' => $purchaseOrders,
            'deliveryOrders' => $deliveryOrders,
            'invoices' => $invoices,
            'purchaseInvoices' => $purchaseInvoices,
            'equipmentAssignments' => $equipmentAssignments,
            'workforces' => Workforce::query()
                ->where('status', 'active')
                ->orderBy('full_name')
                ->get(['id', 'full_name']),
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

        $businessLines = BusinessLine::query()
            ->where(function ($query) use ($project): void {
                $query->where('status', 'active')
                    ->orWhere('id', $project->business_line_id);
            })
            ->orderBy('name')
            ->get(['id', 'name']);

        return Inertia::render('projects/edit', [
            'project' => $project,
            'workforces' => $workforces,
            'businessLines' => $businessLines,
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
     * Cancel the specified project.
     */
    public function cancel(ProjectCancelRequest $request, Project $project): RedirectResponse
    {
        $project->update(['status' => 'cancelled', 'cancel_reason' => $request->validated('cancel_reason')]);

        Inertia::flash('toast', ['type' => 'success', 'message' => __('Project cancelled.')]);

        return to_route('projects.show', $project);
    }

    /**
     * Void the specified project.
     */
    public function void(ProjectVoidRequest $request, Project $project): RedirectResponse
    {
        $project->update(['status' => 'voided', 'void_reason' => $request->validated('void_reason')]);

        Inertia::flash('toast', ['type' => 'success', 'message' => __('Project voided.')]);

        return to_route('projects.show', $project);
    }

    /**
     * Remove the specified project.
     */
    public function destroy(Project $project): RedirectResponse
    {
        if ($project->hasRelatedDocuments()) {
            Inertia::flash('toast', ['type' => 'error', 'message' => __('This project has related documents and cannot be deleted. Void it instead.')]);

            return back();
        }

        $project->delete();

        Inertia::flash('toast', ['type' => 'success', 'message' => __('Project deleted.')]);

        return to_route('projects.index');
    }
}
