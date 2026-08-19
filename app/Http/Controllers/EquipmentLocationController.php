<?php

namespace App\Http\Controllers;

use App\Http\Requests\EquipmentLocationStoreRequest;
use App\Http\Requests\EquipmentLocationUpdateRequest;
use App\Models\EquipmentLocation;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class EquipmentLocationController extends Controller
{
    /**
     * Display a listing of the equipment locations.
     */
    public function index(Request $request): Response
    {
        $search = (string) $request->query('search', '');
        $status = (string) $request->query('status', '');

        $locations = EquipmentLocation::query()
            ->when($search !== '', function ($builder) use ($search): void {
                $builder->where(function ($inner) use ($search): void {
                    $inner->where('name', 'like', "%{$search}%")
                        ->orWhere('code', 'like', "%{$search}%");
                });
            })
            ->when($status !== '' && $status !== 'all', fn ($builder) => $builder->where('is_active', $status === 'active'))
            ->orderBy('name')
            ->paginate(15)
            ->withQueryString();

        return Inertia::render('equipment-locations/index', [
            'locations' => $locations,
            'filters' => ['search' => $search, 'status' => $status],
        ]);
    }

    /**
     * Show the form for creating a new equipment location.
     */
    public function create(): Response
    {
        return Inertia::render('equipment-locations/create');
    }

    /**
     * Store a newly created equipment location.
     */
    public function store(EquipmentLocationStoreRequest $request): RedirectResponse
    {
        $location = EquipmentLocation::create($request->validated());

        Inertia::flash('toast', ['type' => 'success', 'message' => __('Equipment location created.')]);

        return to_route('equipment-locations.show', $location);
    }

    /**
     * Display the specified equipment location.
     */
    public function show(EquipmentLocation $equipmentLocation): Response
    {
        return Inertia::render('equipment-locations/show', [
            'location' => $equipmentLocation,
        ]);
    }

    /**
     * Show the form for editing the specified equipment location.
     */
    public function edit(EquipmentLocation $equipmentLocation): Response
    {
        return Inertia::render('equipment-locations/edit', [
            'location' => $equipmentLocation,
        ]);
    }

    /**
     * Update the specified equipment location.
     */
    public function update(EquipmentLocationUpdateRequest $request, EquipmentLocation $equipmentLocation): RedirectResponse
    {
        $equipmentLocation->update($request->validated());

        Inertia::flash('toast', ['type' => 'success', 'message' => __('Equipment location updated.')]);

        return to_route('equipment-locations.show', $equipmentLocation);
    }

    /**
     * Remove the specified equipment location.
     */
    public function destroy(EquipmentLocation $equipmentLocation): RedirectResponse
    {
        $equipmentLocation->delete();

        Inertia::flash('toast', ['type' => 'success', 'message' => __('Equipment location deleted.')]);

        return to_route('equipment-locations.index');
    }
}
