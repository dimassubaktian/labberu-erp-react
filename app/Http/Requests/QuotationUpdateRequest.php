<?php

namespace App\Http\Requests;

use App\Models\Quotation;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Validator;

class QuotationUpdateRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        $quotation = $this->route('quotation');

        return $quotation instanceof Quotation && $quotation->status === 'draft';
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'currency_id' => ['required', Rule::exists('currencies', 'id')->whereNull('deleted_at')],
            'valid_until' => ['nullable', 'date'],
            'discount_type' => ['nullable', 'string', 'in:percentage,fixed'],
            'discount_value' => ['nullable', 'numeric', 'min:0', 'required_with:discount_type'],
            'tax_id' => ['nullable', Rule::exists('taxes', 'id')->whereNull('deleted_at')],
            'remarks' => ['nullable', 'string', 'max:2000'],
            'items' => ['nullable', 'array'],
            'items.*.product_id' => ['required', Rule::exists('products', 'id')->whereNull('deleted_at')],
            'items.*.description' => ['nullable', 'string', 'max:2000'],
            'items.*.quantity' => ['required', 'numeric', 'min:0.01'],
            'items.*.unit' => ['required', 'string', 'max:50'],
            'items.*.unit_price' => ['required', 'numeric', 'min:0'],
            'items.*.unit_cost' => ['required', 'numeric', 'min:0'],
            'items.*.discount_type' => ['nullable', 'string', 'in:percentage,fixed'],
            'items.*.discount_value' => ['nullable', 'numeric', 'min:0', 'required_with:items.*.discount_type'],
            'groups' => ['nullable', 'array'],
            'groups.*.name' => ['required', 'string', 'max:255'],
            'groups.*.discount_type' => ['nullable', 'string', 'in:percentage,fixed'],
            'groups.*.discount_value' => ['nullable', 'numeric', 'min:0', 'required_with:groups.*.discount_type'],
            'groups.*.tax_id' => ['nullable', Rule::exists('taxes', 'id')->whereNull('deleted_at')],
            'groups.*.items' => ['required', 'array', 'min:1'],
            'groups.*.items.*.product_id' => ['required', Rule::exists('products', 'id')->whereNull('deleted_at')],
            'groups.*.items.*.description' => ['nullable', 'string', 'max:2000'],
            'groups.*.items.*.quantity' => ['required', 'numeric', 'min:0.01'],
            'groups.*.items.*.unit' => ['required', 'string', 'max:50'],
            'groups.*.items.*.unit_price' => ['required', 'numeric', 'min:0'],
            'groups.*.items.*.unit_cost' => ['required', 'numeric', 'min:0'],
            'groups.*.items.*.discount_type' => ['nullable', 'string', 'in:percentage,fixed'],
            'groups.*.items.*.discount_value' => ['nullable', 'numeric', 'min:0', 'required_with:groups.*.items.*.discount_type'],
        ];
    }

    /**
     * Configure the validator instance.
     */
    public function withValidator(Validator $validator): void
    {
        $validator->after(function (Validator $validator): void {
            $hasItems = filled($this->input('items'));
            $hasGroupItems = collect((array) $this->input('groups', []))->contains(fn ($group) => filled($group['items'] ?? null));

            if (! $hasItems && ! $hasGroupItems) {
                $validator->errors()->add('items', __('At least one line item is required.'));
            }
        });
    }
}
