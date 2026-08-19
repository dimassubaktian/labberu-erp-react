<?php

namespace App\Http\Controllers;

use App\Http\Requests\EquipmentAssignmentReturnRequest;
use App\Http\Requests\EquipmentAssignmentStoreRequest;
use App\Models\Equipment;
use App\Models\EquipmentAssignment;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;

class EquipmentAssignmentController extends Controller
{
    /**
     * Check out the specified equipment to a project and/or custodian. Any currently open
     * assignment is closed first, so equipment only ever has one active location at a time.
     */
    public function store(EquipmentAssignmentStoreRequest $request, Equipment $equipment): RedirectResponse
    {
        $data = $request->validated();
        $data['created_by'] = $request->user()->id;

        $equipment->checkOut($data);

        Inertia::flash('toast', ['type' => 'success', 'message' => __('Equipment checked out.')]);

        return to_route('equipment.show', $equipment);
    }

    /**
     * Return the specified equipment from its currently open assignment back to storage.
     */
    public function return(EquipmentAssignmentReturnRequest $request, Equipment $equipment, EquipmentAssignment $assignment): RedirectResponse
    {
        abort_unless($assignment->equipment_id === $equipment->id, 404);

        DB::transaction(function () use ($request, $equipment, $assignment): void {
            $assignment->update([
                'returned_at' => now(),
                'notes' => $request->validated('notes') ?? $assignment->notes,
            ]);

            // Sync first (clears the project/custodian and would default the status back to
            // available), then apply the condition the returner actually reported.
            $equipment->syncCurrentAssignment();
            $equipment->update(['status' => $request->validated('status')]);
        });

        Inertia::flash('toast', ['type' => 'success', 'message' => __('Equipment returned.')]);

        return to_route('equipment.show', $equipment);
    }
}
