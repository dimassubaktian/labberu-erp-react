<?php

namespace App\Http\Requests;

use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class PurchaseOrderStoreRequest extends FormRequest
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
            'project_id' => ['required', Rule::exists('projects', 'id')->whereNull('deleted_at')],
            'quotation_id' => ['required', Rule::exists('quotations', 'id')->whereNull('deleted_at')],
            'customer_id' => ['required', Rule::exists('customers', 'id')->whereNull('deleted_at')],
            'vendor_id' => ['required', Rule::exists('vendors', 'id')->whereNull('deleted_at')],
            'address' => ['nullable', 'string', 'max:255'],
            'attention' => ['nullable', 'string', 'max:255'],
            'phone' => ['nullable', 'string', 'max:50'],
            'fax' => ['nullable', 'string', 'max:50'],
            'quotation_no' => ['nullable', 'string', 'max:255'],
            'quotation_date' => ['nullable', 'date'],
            'project_name' => ['required', 'string', 'max:255'],
            'date' => ['required', 'date'],
            'currency_id' => ['required', Rule::exists('currencies', 'id')->whereNull('deleted_at')],
            'tax_id' => ['nullable', Rule::exists('taxes', 'id')->whereNull('deleted_at')],
            'shipping_method' => ['nullable', 'string', 'max:255'],
            'shipping_terms' => ['nullable', 'string', 'max:255'],
            'delivery_date' => ['nullable', 'date'],
            'items' => ['required', 'array', 'min:1'],
            'items.*.product_id' => ['required', Rule::exists('products', 'id')->whereNull('deleted_at')],
            'items.*.bom_item_id' => ['nullable', Rule::exists('bom_items', 'id')],
            'items.*.reference_number' => ['nullable', 'string', 'max:255'],
            'items.*.description' => ['nullable', 'string', 'max:2000'],
            'items.*.quantity' => ['required', 'numeric', 'min:0.01'],
            'items.*.unit' => ['required', 'string', 'max:50'],
            'items.*.unit_price' => ['required', 'numeric', 'min:0'],
            'items.*.discount_type' => ['nullable', 'string', 'in:percentage,fixed'],
            'items.*.discount_value' => ['nullable', 'numeric', 'min:0', 'required_with:items.*.discount_type'],
            'discounts' => ['nullable', 'array'],
            'discounts.*.label' => ['required', 'string', 'max:255'],
            'discounts.*.discount_type' => ['required', 'string', 'in:percentage,fixed'],
            'discounts.*.discount_value' => ['required', 'numeric', 'min:0'],
        ];
    }
}
