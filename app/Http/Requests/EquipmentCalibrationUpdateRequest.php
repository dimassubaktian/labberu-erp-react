<?php

namespace App\Http\Requests;

use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class EquipmentCalibrationUpdateRequest extends FormRequest
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
        return [
            'certificate_number' => ['nullable', 'string', 'max:255'],
            'calibration_date' => ['required', 'date'],
            'due_date' => ['required', 'date', 'after_or_equal:calibration_date'],
            'provider_id' => ['nullable', Rule::exists('vendors', 'id')->whereNull('deleted_at')],
            'result' => ['required', 'string', 'in:passed,failed,conditional'],
            'certificate_file' => ['nullable', 'file', 'max:10240', 'mimes:pdf,png,jpg,jpeg'],
            'cost' => ['nullable', 'numeric', 'min:0'],
            'notes' => ['nullable', 'string', 'max:2000'],
        ];
    }
}
