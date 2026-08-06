<?php

namespace App\Http\Requests;

use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class BusinessLineUpdateRequest extends FormRequest
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
        $businessLine = $this->route('businessLine');

        return [
            'name' => ['required', 'string', 'max:255', Rule::unique('business_lines', 'name')->ignore($businessLine?->id)->whereNull('deleted_at')],
            'description' => ['nullable', 'string', 'max:2000'],
            'status' => ['required', 'string', 'in:active,inactive'],
        ];
    }
}
