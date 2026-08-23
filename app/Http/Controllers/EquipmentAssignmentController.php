<?php

namespace App\Http\Controllers;

use App\Http\Requests\EquipmentAssignmentReturnRequest;
use App\Http\Requests\EquipmentAssignmentStoreRequest;
use App\Models\Equipment;
use App\Models\EquipmentAssignment;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;
use Symfony\Component\HttpFoundation\StreamedResponse;

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

        if ($request->hasFile('checkout_photo')) {
            $data['checkout_photo'] = $request->file('checkout_photo')->store('equipment-assignment-photos', 'local');
        }

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
            $returnData = [
                'returned_at' => now(),
                'notes' => $request->validated('notes') ?? $assignment->notes,
            ];

            if ($request->hasFile('return_photo')) {
                $returnData['return_photo'] = $request->file('return_photo')->store('equipment-assignment-photos', 'local');
            }

            $assignment->update($returnData);

            // Sync first (clears the project/custodian and would default the status back to
            // available), then apply the condition the returner actually reported.
            $equipment->syncCurrentAssignment();
            $equipment->update(['status' => $request->validated('status')]);
        });

        Inertia::flash('toast', ['type' => 'success', 'message' => __('Equipment returned.')]);

        return to_route('equipment.show', $equipment);
    }

    /**
     * Stream the checkout proof photo for the specified assignment to authenticated users only.
     */
    public function checkoutPhoto(Equipment $equipment, EquipmentAssignment $assignment): StreamedResponse
    {
        abort_unless($assignment->equipment_id === $equipment->id, 404);
        abort_unless($assignment->checkout_photo && Storage::disk('local')->exists($assignment->checkout_photo), 404);

        return Storage::disk('local')->response($assignment->checkout_photo);
    }

    /**
     * Stream the return proof photo for the specified assignment to authenticated users only.
     */
    public function returnPhoto(Equipment $equipment, EquipmentAssignment $assignment): StreamedResponse
    {
        abort_unless($assignment->equipment_id === $equipment->id, 404);
        abort_unless($assignment->return_photo && Storage::disk('local')->exists($assignment->return_photo), 404);

        return Storage::disk('local')->response($assignment->return_photo);
    }
}
