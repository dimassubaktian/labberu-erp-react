<?php

namespace App\Http\Requests;

use App\Models\Quotation;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Validator;

class BomUpdateRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        $quotation = $this->route('quotation');

        return $quotation instanceof Quotation && $quotation->status === 'draft' && $quotation->bom()->exists();
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'remarks' => ['nullable', 'string', 'max:2000'],
            'overhead_percentage' => ['nullable', 'numeric', 'min:0', 'max:999.99'],
            'selling_percentage' => ['nullable', 'numeric', 'min:0', 'max:999.99'],

            'items' => ['nullable', 'array'],
            ...self::itemRules('items.*'),

            'subgroups' => ['nullable', 'array'],
            'subgroups.*.name' => ['required', 'string', 'max:255'],
            'subgroups.*.items' => ['required', 'array', 'min:1'],
            ...self::itemRules('subgroups.*.items.*'),

            'groups' => ['nullable', 'array'],
            'groups.*.name' => ['required', 'string', 'max:255'],
            'groups.*.items' => ['nullable', 'array'],
            ...self::itemRules('groups.*.items.*'),
            'groups.*.subgroups' => ['nullable', 'array'],
            'groups.*.subgroups.*.name' => ['required', 'string', 'max:255'],
            'groups.*.subgroups.*.items' => ['required', 'array', 'min:1'],
            ...self::itemRules('groups.*.subgroups.*.items.*'),
        ];
    }

    /**
     * Build the validation rules for a material line item at the given dot-notation prefix.
     *
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    private static function itemRules(string $prefix): array
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
            $hasTopLevelItems = filled($this->input('items'));
            $hasTopLevelSubgroupItems = collect((array) $this->input('subgroups', []))
                ->contains(fn ($subgroup) => filled($subgroup['items'] ?? null));

            $groups = collect((array) $this->input('groups', []));
            $hasGroupItems = $groups->contains(fn ($group) => self::groupHasItems($group));

            if (! $hasTopLevelItems && ! $hasTopLevelSubgroupItems && ! $hasGroupItems) {
                $validator->errors()->add('items', __('At least one material is required.'));
            }

            $groups->each(function (array $group, int $index) use ($validator): void {
                if (! self::groupHasItems($group)) {
                    $validator->errors()->add("groups.{$index}.items", __('This group needs at least one material, directly or inside a subgroup.'));
                }
            });
        });
    }

    /**
     * Determine whether a group has materials directly or inside any of its subgroups.
     *
     * @param  array<string, mixed>  $group
     */
    private static function groupHasItems(array $group): bool
    {
        $hasDirectItems = filled($group['items'] ?? null);
        $hasSubgroupItems = collect((array) ($group['subgroups'] ?? []))
            ->contains(fn ($subgroup) => filled($subgroup['items'] ?? null));

        return $hasDirectItems || $hasSubgroupItems;
    }
}
