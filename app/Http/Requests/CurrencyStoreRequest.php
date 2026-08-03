<?php

namespace App\Http\Requests;

use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class CurrencyStoreRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return true;
    }

    /**
     * Prepare the data for validation.
     */
    protected function prepareForValidation(): void
    {
        $this->merge([
            'iso_code' => strtoupper((string) $this->input('iso_code')),
            'base_currency' => $this->boolean('base_currency'),
        ]);
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'iso_code' => ['required', 'string', 'size:3', 'alpha', Rule::unique('currencies', 'iso_code')->whereNull('deleted_at')],
            'name' => ['required', 'string', 'max:255'],
            'symbol' => ['nullable', 'string', 'max:10'],
            'status' => ['required', 'string', 'in:active,inactive'],
            'base_currency' => ['required', 'boolean'],
        ];
    }
}
