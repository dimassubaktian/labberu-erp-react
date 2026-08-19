<?php

namespace App\Http\Controllers;

use App\Http\Requests\EquipmentCalibrationStoreRequest;
use App\Http\Requests\EquipmentCalibrationUpdateRequest;
use App\Models\Equipment;
use App\Models\EquipmentCalibration;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;
use Symfony\Component\HttpFoundation\StreamedResponse;

class EquipmentCalibrationController extends Controller
{
    /**
     * Store a newly recorded calibration certificate for the specified equipment.
     */
    public function store(EquipmentCalibrationStoreRequest $request, Equipment $equipment): RedirectResponse
    {
        $data = $request->validated();
        $data['created_by'] = $request->user()->id;

        if ($request->hasFile('certificate_file')) {
            $data['certificate_file'] = $request->file('certificate_file')->store('equipment-certificates', 'local');
        }

        $equipment->calibrations()->create($data);
        $equipment->recomputeCalibration();

        Inertia::flash('toast', ['type' => 'success', 'message' => __('Calibration recorded.')]);

        return to_route('equipment.show', $equipment);
    }

    /**
     * Update the specified calibration record.
     */
    public function update(EquipmentCalibrationUpdateRequest $request, Equipment $equipment, EquipmentCalibration $calibration): RedirectResponse
    {
        abort_unless($calibration->equipment_id === $equipment->id, 404);

        $data = $request->validated();

        if ($request->hasFile('certificate_file')) {
            if ($calibration->certificate_file) {
                Storage::disk('local')->delete($calibration->certificate_file);
            }

            $data['certificate_file'] = $request->file('certificate_file')->store('equipment-certificates', 'local');
        }

        $calibration->update($data);
        $equipment->recomputeCalibration();

        Inertia::flash('toast', ['type' => 'success', 'message' => __('Calibration record updated.')]);

        return to_route('equipment.show', $equipment);
    }

    /**
     * Stream the specified calibration certificate to authenticated users only.
     */
    public function download(Equipment $equipment, EquipmentCalibration $calibration): StreamedResponse
    {
        abort_unless($calibration->equipment_id === $equipment->id, 404);
        abort_unless($calibration->certificate_file && Storage::disk('local')->exists($calibration->certificate_file), 404);

        return Storage::disk('local')->download($calibration->certificate_file);
    }

    /**
     * Remove the specified calibration record.
     */
    public function destroy(Equipment $equipment, EquipmentCalibration $calibration): RedirectResponse
    {
        abort_unless($calibration->equipment_id === $equipment->id, 404);

        if ($calibration->certificate_file) {
            Storage::disk('local')->delete($calibration->certificate_file);
        }

        $calibration->delete();
        $equipment->recomputeCalibration();

        Inertia::flash('toast', ['type' => 'success', 'message' => __('Calibration record deleted.')]);

        return to_route('equipment.show', $equipment);
    }
}
