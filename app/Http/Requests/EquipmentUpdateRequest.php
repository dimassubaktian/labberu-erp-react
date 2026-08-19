<?php

namespace App\Http\Requests;

use App\Models\Equipment;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class EquipmentUpdateRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return true;
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        /** @var Equipment $equipment */
        $equipment = $this->route('equipment');

        return [
            'name' => ['required', 'string', 'max:255'],
            'category' => ['required', 'string', 'in:Multimeter,Clamp Meter,Insulation Tester,Earth Resistance Tester,Power Quality Analyzer,Oscilloscope,Torque Wrench,Pressure Gauge,Thermometer,Caliper,Other'],
            'model_type' => ['nullable', 'string', 'max:255'],
            'serial_number' => ['nullable', 'string', 'max:255', Rule::unique('equipment', 'serial_number')->ignore($equipment->id)->whereNull('deleted_at')],
            'brand' => ['nullable', 'string', 'max:255'],
            'picture' => ['nullable', 'image', 'max:4096'],
            'purchase_date' => ['nullable', 'date'],
            'purchase_cost' => ['nullable', 'numeric', 'min:0'],
            'vendor_id' => ['nullable', Rule::exists('vendors', 'id')->whereNull('deleted_at')],
            'warranty_expiry_date' => ['nullable', 'date'],
            'calibration_required' => ['required', 'boolean'],
            'calibration_interval_months' => ['nullable', 'integer', 'min:1', 'max:120', 'required_if:calibration_required,1'],
            'status' => ['required', 'string', 'in:available,in_use,in_calibration,under_maintenance,retired,lost,damaged'],
            'remarks' => ['nullable', 'string', 'max:2000'],
        ];
    }
}
