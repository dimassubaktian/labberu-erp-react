<?php

namespace App\Http\Requests;

use App\Models\Quotation;
use App\Models\QuotationItem;
use App\Services\DeliveryOrderQuantityValidator;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Validator;

class DeliveryOrderStoreRequest extends FormRequest
{
    public function __construct(
        private readonly DeliveryOrderQuantityValidator $quantityValidator,
    ) {
        parent::__construct();
    }

    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        $quotation = Quotation::query()->find((int) $this->input('quotation_id'));

        return $quotation instanceof Quotation && $quotation->status === 'approved';
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'quotation_id' => ['required', Rule::exists('quotations', 'id')->whereNull('deleted_at')],
            'delivery_date' => ['required', 'date'],
            'remarks' => ['nullable', 'string', 'max:2000'],
            'items' => ['required', 'array', 'min:1'],
            'items.*.quotation_item_id' => ['required', 'distinct', Rule::exists('quotation_items', 'id')],
            'items.*.quantity_delivered' => ['required', 'numeric', 'min:0'],
        ];
    }

    /**
     * Add cross-version delivery quantity validation.
     *
     * @return array<int, callable>
     */
    public function after(): array
    {
        return [function (Validator $validator): void {
            $quotation = Quotation::query()->find((int) $this->input('quotation_id'));

            if (! $quotation) {
                return;
            }

            $this->assertItemsBelongToQuotation($validator, $quotation->id);

            foreach ($this->quantityValidator->errorsFor($quotation, (array) $this->input('items', [])) as $field => $message) {
                $validator->errors()->add($field, $message);
            }
        }];
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
