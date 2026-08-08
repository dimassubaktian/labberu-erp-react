<?php

namespace App\Http\Requests;

use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Validator;

class QuotationStoreRequest extends FormRequest
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
            'currency_id' => ['required', Rule::exists('currencies', 'id')->whereNull('deleted_at')],
            'valid_until' => ['nullable', 'date'],
            'discount_type' => ['nullable', 'string', 'in:percentage,fixed'],
            'discount_value' => ['nullable', 'numeric', 'min:0', 'required_with:discount_type'],
            'tax_id' => ['nullable', Rule::exists('taxes', 'id')->whereNull('deleted_at')],
            'remarks' => ['nullable', 'string', 'max:2000'],
            'payment_term_template_id' => ['nullable', Rule::exists('payment_term_templates', 'id')->whereNull('deleted_at')],
            'payment_terms_html' => ['nullable', 'string'],
            'items' => ['nullable', 'array'],
            'items.*.product_id' => ['required', Rule::exists('products', 'id')->whereNull('deleted_at')],
            'items.*.description' => ['nullable', 'string', 'max:2000'],
            'items.*.quantity' => ['required', 'numeric', 'min:0.01'],
            'items.*.unit' => ['required', 'string', 'in:Pcs,Unit,Set,Box,Roll,Meter,Kg,Liter,Pack,Other'],
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
            'groups.*.items.*.unit' => ['required', 'string', 'in:Pcs,Unit,Set,Box,Roll,Meter,Kg,Liter,Pack,Other'],
            'groups.*.items.*.unit_price' => ['required', 'numeric', 'min:0'],
            'groups.*.items.*.unit_cost' => ['required', 'numeric', 'min:0'],
            'groups.*.items.*.discount_type' => ['nullable', 'string', 'in:percentage,fixed'],
            'groups.*.items.*.discount_value' => ['nullable', 'numeric', 'min:0', 'required_with:groups.*.items.*.discount_type'],

            'bom' => ['nullable', 'array'],
            'bom.remarks' => ['nullable', 'string', 'max:2000'],
            'bom.overhead_percentage' => ['nullable', 'numeric', 'min:0', 'max:999.99'],
            'bom.selling_percentage' => ['nullable', 'numeric', 'min:0', 'max:999.99'],
            'bom.items' => ['nullable', 'array'],
            ...self::bomItemRules('bom.items.*'),
            'bom.subgroups' => ['nullable', 'array'],
            'bom.subgroups.*.name' => ['required_with:bom.subgroups', 'string', 'max:255'],
            'bom.subgroups.*.items' => ['required_with:bom.subgroups', 'array', 'min:1'],
            ...self::bomItemRules('bom.subgroups.*.items.*'),
            'bom.groups' => ['nullable', 'array'],
            'bom.groups.*.name' => ['required_with:bom.groups', 'string', 'max:255'],
            'bom.groups.*.items' => ['nullable', 'array'],
            ...self::bomItemRules('bom.groups.*.items.*'),
            'bom.groups.*.subgroups' => ['nullable', 'array'],
            'bom.groups.*.subgroups.*.name' => ['required_with:bom.groups.*.subgroups', 'string', 'max:255'],
            'bom.groups.*.subgroups.*.items' => ['required_with:bom.groups.*.subgroups', 'array', 'min:1'],
            ...self::bomItemRules('bom.groups.*.subgroups.*.items.*'),
        ];
    }

    /**
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    private static function bomItemRules(string $prefix): array
    {
        return [
            "{$prefix}.product_id" => ['required', Rule::exists('products', 'id')->whereNull('deleted_at')],
            "{$prefix}.description" => ['nullable', 'string', 'max:2000'],
            "{$prefix}.brand" => ['required', 'string', 'max:255'],
            "{$prefix}.quantity" => ['required', 'numeric', 'min:0.01'],
            "{$prefix}.unit" => ['required', 'string', 'in:Pcs,Unit,Set,Box,Roll,Meter,Kg,Liter,Pack,Other'],
            "{$prefix}.unit_cost" => ['required', 'numeric', 'min:0'],
            "{$prefix}.discount_type" => ['nullable', 'string', 'in:percentage,fixed'],
            "{$prefix}.discount_value" => ['nullable', 'numeric', 'min:0', "required_with:{$prefix}.discount_type"],
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
