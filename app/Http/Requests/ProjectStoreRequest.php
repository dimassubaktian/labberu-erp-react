<?php

namespace App\Http\Requests;

use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class ProjectStoreRequest extends FormRequest
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
            'name' => ['required', 'string', 'max:255'],
            'customer_id' => ['required', Rule::exists('customers', 'id')->whereNull('deleted_at')],
            'business_line_id' => ['nullable', Rule::exists('business_lines', 'id')->whereNull('deleted_at')],
            'request_date' => ['required', 'date'],
            'person_in_charge_id' => ['nullable', Rule::exists('workforces', 'id')->whereNull('deleted_at')],
            'description' => ['nullable', 'string', 'max:2000'],
            'status' => ['required', 'string', 'in:new,planning,in_progress,completed,cancelled'],
            'priority' => ['required', 'string', 'in:low,medium,high,urgent'],
            'equipment_calibration_max_age_months' => ['nullable', 'integer', 'min:1', 'max:120'],
            'start_date' => ['nullable', 'date'],
            'end_date' => ['nullable', 'date', 'after_or_equal:start_date'],
            'estimate_contract_value' => ['nullable', 'numeric', 'min:0'],
            'estimate_cost' => ['nullable', 'numeric', 'min:0'],
        ];
    }
}
