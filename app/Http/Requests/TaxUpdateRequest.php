<?php

namespace App\Http\Requests;

use App\Models\Tax;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class TaxUpdateRequest extends FormRequest
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
            'code' => strtoupper((string) $this->input('code')),
        ]);
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        /** @var Tax $tax */
        $tax = $this->route('tax');

        return [
            'name' => ['required', 'string', 'max:255'],
            'code' => ['required', 'string', 'max:50', Rule::unique('taxes', 'code')->ignore($tax->id)->whereNull('deleted_at')],
            'rate' => ['required', 'numeric', 'min:0', 'max:999999.99'],
            'type' => ['required', 'string', 'in:percentage,fixed'],
        ];
    }
}
