<?php

namespace App\Http\Controllers;

use App\Http\Requests\EquipmentLocationMoveStoreRequest;
use App\Models\Equipment;
use Illuminate\Http\RedirectResponse;
use Inertia\Inertia;

class EquipmentLocationMoveController extends Controller
{
    /**
     * Record a move of the specified equipment to a physical storage location.
     */
    public function store(EquipmentLocationMoveStoreRequest $request, Equipment $equipment): RedirectResponse
    {
        $data = $request->validated();
        $data['created_by'] = $request->user()->id;

        $equipment->moveToLocation($data);

        Inertia::flash('toast', ['type' => 'success', 'message' => __('Equipment location updated.')]);

        return to_route('equipment.show', $equipment);
    }
}
