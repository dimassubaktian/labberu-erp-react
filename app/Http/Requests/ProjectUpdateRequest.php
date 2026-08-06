<?php

namespace App\Http\Requests;

use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class ProjectUpdateRequest extends FormRequest
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
            'start_date' => ['nullable', 'date'],
            'end_date' => ['nullable', 'date', 'after_or_equal:start_date'],
            'completed_at' => ['nullable', 'date'],
            'estimate_contract_value' => ['nullable', 'numeric', 'min:0'],
            'estimate_cost' => ['nullable', 'numeric', 'min:0'],
            'actual_cost' => ['nullable', 'numeric', 'min:0'],
            'actual_contract_value' => ['nullable', 'numeric', 'min:0'],
        ];
    }
}
