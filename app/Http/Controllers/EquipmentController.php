<?php

namespace App\Http\Controllers;

use App\Http\Requests\EquipmentStoreRequest;
use App\Http\Requests\EquipmentUpdateRequest;
use App\Models\Equipment;
use App\Models\EquipmentCalibration;
use App\Models\Project;
use App\Models\Workforce;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;
use Inertia\Response;
use Symfony\Component\HttpFoundation\StreamedResponse;

class EquipmentController extends Controller
{
    /**
     * Search available equipment for async select pickers, such as checking out a tool from a
     * project's page. Only equipment that is currently available can be checked out.
     *
     * When a project is given, equipment that doesn't meet that project's required calibration
     * recency is left out too, so the picker never offers a tool the checkout would reject.
     */
    public function search(Request $request): JsonResponse
    {
        $query = (string) $request->query('q', '');
        $project = $request->query('project')
            ? Project::query()->find($request->query('project'))
            : null;

        $equipment = Equipment::query()
            ->where('status', 'available')
            ->when($query !== '', function ($builder) use ($query): void {
                $builder->where(function ($inner) use ($query): void {
                    $inner->where('equipment_code', 'like', "%{$query}%")
                        ->orWhere('name', 'like', "%{$query}%")
                        ->orWhere('serial_number', 'like', "%{$query}%")
                        ->orWhere('brand', 'like', "%{$query}%");
                });
            })
            ->orderBy('name')
            ->limit($project?->equipment_calibration_max_age_months !== null ? 100 : 20)
            ->get(['id', 'uuid', 'equipment_code', 'name', 'category', 'calibration_required']);

        if ($project?->equipment_calibration_max_age_months !== null) {
            $cutoff = Carbon::now()->subMonths($project->equipment_calibration_max_age_months);

            $lastCalibratedAt = EquipmentCalibration::query()
                ->whereIn('equipment_id', $equipment->pluck('id'))
                ->selectRaw('equipment_id, MAX(calibration_date) as last_calibrated_at')
                ->groupBy('equipment_id')
                ->pluck('last_calibrated_at', 'equipment_id');

            $equipment = $equipment
                ->filter(function (Equipment $item) use ($lastCalibratedAt, $cutoff): bool {
                    if (! $item->calibration_required) {
                        return true;
                    }

                    $calibratedAt = $lastCalibratedAt->get($item->id);

                    return $calibratedAt !== null && Carbon::parse($calibratedAt)->greaterThanOrEqualTo($cutoff);
                })
                ->take(20)
                ->values();
        }

        return response()->json(['data' => $equipment]);
    }

    /**
     * Display a listing of the equipment.
     */
    public function index(Request $request): Response
    {
        $search = (string) $request->query('search', '');
        $category = (string) $request->query('category', '');
        $status = (string) $request->query('status', '');
        $calibration = (string) $request->query('calibration', '');

        $dueSoonThreshold = Carbon::today()->addDays(30);

        $equipment = Equipment::query()
            ->with(['currentProject:id,uuid,name', 'currentCustodian:id,full_name'])
            ->when($search !== '', function ($builder) use ($search): void {
                $builder->where(function ($inner) use ($search): void {
                    $inner->where('equipment_code', 'like', "%{$search}%")
                        ->orWhere('name', 'like', "%{$search}%")
                        ->orWhere('serial_number', 'like', "%{$search}%")
                        ->orWhere('brand', 'like', "%{$search}%");
                });
            })
            ->when($category !== '' && $category !== 'all', fn ($builder) => $builder->where('category', $category))
            ->when($status !== '' && $status !== 'all', fn ($builder) => $builder->where('status', $status))
            ->when($calibration === 'overdue', fn ($builder) => $builder->whereDate('next_calibration_due_date', '<', Carbon::today()))
            ->when($calibration === 'due_soon', fn ($builder) => $builder->whereBetween('next_calibration_due_date', [Carbon::today(), $dueSoonThreshold]))
            ->orderBy('name')
            ->paginate(15)
            ->withQueryString();

        return Inertia::render('equipment/index', [
            'equipment' => $equipment,
            'filters' => ['search' => $search, 'category' => $category, 'status' => $status, 'calibration' => $calibration],
            'calibrationCounts' => [
                'overdue' => Equipment::query()->whereDate('next_calibration_due_date', '<', Carbon::today())->count(),
                'due_soon' => Equipment::query()->whereBetween('next_calibration_due_date', [Carbon::today(), $dueSoonThreshold])->count(),
            ],
        ]);
    }

    /**
     * Show the form for creating new equipment.
     */
    public function create(): Response
    {
        return Inertia::render('equipment/create');
    }

    /**
     * Store newly created equipment.
     */
    public function store(EquipmentStoreRequest $request): RedirectResponse
    {
        $data = $request->validated();

        if ($request->hasFile('picture')) {
            $data['picture'] = $request->file('picture')->store('equipment-pictures', 'local');
        }

        $equipment = Equipment::create($data);

        Inertia::flash('toast', ['type' => 'success', 'message' => __('Equipment created.')]);

        return to_route('equipment.show', $equipment);
    }

    /**
     * Display the specified equipment.
     */
    public function show(Equipment $equipment): Response
    {
        $equipment->load([
            'vendor:id,uuid,name',
            'currentProject:id,uuid,name',
            'currentCustodian:id,full_name',
            'calibrations.provider:id,name',
            'calibrations.creator:id,name',
            'assignments.project:id,uuid,name',
            'assignments.custodian:id,full_name',
            'assignments.creator:id,name',
        ]);

        return Inertia::render('equipment/show', [
            'equipment' => $equipment,
            'workforces' => Workforce::query()
                ->where('status', 'active')
                ->orderBy('full_name')
                ->get(['id', 'full_name']),
        ]);
    }

    /**
     * Show the form for editing the specified equipment.
     */
    public function edit(Equipment $equipment): Response
    {
        $equipment->load('vendor:id,uuid,name');

        return Inertia::render('equipment/edit', [
            'equipment' => $equipment,
        ]);
    }

    /**
     * Update the specified equipment.
     */
    public function update(EquipmentUpdateRequest $request, Equipment $equipment): RedirectResponse
    {
        $data = $request->validated();

        if ($request->hasFile('picture')) {
            if ($equipment->picture) {
                Storage::disk('local')->delete($equipment->picture);
            }

            $data['picture'] = $request->file('picture')->store('equipment-pictures', 'local');
        }

        $equipment->update($data);

        Inertia::flash('toast', ['type' => 'success', 'message' => __('Equipment updated.')]);

        return to_route('equipment.show', $equipment);
    }

    /**
     * Remove the specified equipment.
     */
    public function destroy(Equipment $equipment): RedirectResponse
    {
        $equipment->delete();

        Inertia::flash('toast', ['type' => 'success', 'message' => __('Equipment deleted.')]);

        return to_route('equipment.index');
    }

    /**
     * Stream the equipment's picture to authenticated users only.
     */
    public function picture(Equipment $equipment): StreamedResponse
    {
        abort_unless($equipment->picture && Storage::disk('local')->exists($equipment->picture), 404);

        return Storage::disk('local')->response($equipment->picture);
    }
}
