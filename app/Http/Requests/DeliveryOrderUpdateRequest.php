<?php

namespace App\Http\Requests;

use App\Models\DeliveryOrder;
use App\Models\QuotationItem;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Validator;

class DeliveryOrderUpdateRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        $deliveryOrder = $this->route('deliveryOrder');

        return $deliveryOrder instanceof DeliveryOrder && $deliveryOrder->status === 'draft';
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        $deliveryOrder = $this->route('deliveryOrder');

        return [
            'quotation_id' => [
                'required',
                Rule::exists('quotations', 'id')->whereNull('deleted_at'),
                Rule::in([$deliveryOrder instanceof DeliveryOrder ? $deliveryOrder->quotation_id : null]),
            ],
            'delivery_date' => ['required', 'date'],
            'remarks' => ['nullable', 'string', 'max:2000'],
            'items' => ['required', 'array', 'min:1'],
            'items.*.quotation_item_id' => ['required', Rule::exists('quotation_items', 'id')],
            'items.*.quantity_delivered' => ['required', 'numeric', 'min:0'],
        ];
    }

    /**
     * Configure the validator instance.
     */
    public function withValidator(Validator $validator): void
    {
        $validator->after(function (Validator $validator): void {
            $this->assertItemsBelongToQuotation($validator, (int) $this->input('quotation_id'));
        });
    }

    /**
     * Ensure every submitted item references a quotation line item that actually belongs to
     * the submitted quotation.
     */
    private function assertItemsBelongToQuotation(Validator $validator, int $quotationId): void
    {
        $items = collect((array) $this->input('items', []));
        $itemIds = $items->pluck('quotation_item_id')->filter()->all();

        if ($itemIds === []) {
            return;
        }

        $validItemIds = QuotationItem::query()
            ->where('quotation_id', $quotationId)
            ->whereIn('id', $itemIds)
            ->pluck('id')
            ->all();

        $items->each(function (array $item, int $index) use ($validator, $validItemIds): void {
            if (isset($item['quotation_item_id']) && ! in_array((int) $item['quotation_item_id'], $validItemIds, true)) {
                $validator->errors()->add("items.{$index}.quotation_item_id", __('This item does not belong to the selected quotation.'));
            }
        });
    }
}
