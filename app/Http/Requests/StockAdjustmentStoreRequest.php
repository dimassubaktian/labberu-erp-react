<?php

namespace App\Http\Requests;

use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StockAdjustmentStoreRequest extends FormRequest
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
            'product_id' => ['required', Rule::exists('products', 'id')->whereNull('deleted_at')],
            'type' => ['required', 'string', 'in:increase,decrease'],
            'quantity' => ['required', 'numeric', 'min:0.01'],
            'reason' => ['required', 'string', 'in:Stock Count Correction,Damage,Loss or Theft,Initial Stock Load,Other'],
            'note' => ['nullable', 'string', 'max:2000'],
        ];
    }
}
