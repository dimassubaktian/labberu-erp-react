<?php

namespace App\Http\Requests;

use App\Models\Currency;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class CurrencyUpdateRequest extends FormRequest
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
        ]);
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        /** @var Currency $currency */
        $currency = $this->route('currency');

        return [
            'iso_code' => ['required', 'string', 'size:3', 'alpha', Rule::unique('currencies', 'iso_code')->ignore($currency->id)->whereNull('deleted_at')],
            'name' => ['required', 'string', 'max:255'],
            'symbol' => ['nullable', 'string', 'max:10'],
            'status' => ['required', 'string', 'in:active,inactive'],
        ];
    }
}
