<?php

namespace App\Http\Requests;

use App\Models\PurchaseOrder;
use App\Models\PurchaseOrderItem;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Validator;

class GoodsReceiptNoteStoreRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        $purchaseOrder = PurchaseOrder::query()->find((int) $this->input('purchase_order_id'));

        return $purchaseOrder instanceof PurchaseOrder && $purchaseOrder->status === 'approved';
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'purchase_order_id' => ['required', Rule::exists('purchase_orders', 'id')->whereNull('deleted_at')],
            'received_date' => ['required', 'date'],
            'remarks' => ['nullable', 'string', 'max:2000'],
            'items' => ['required', 'array', 'min:1'],
            'items.*.purchase_order_item_id' => ['required', Rule::exists('purchase_order_items', 'id')],
            'items.*.quantity_accepted' => ['required', 'numeric', 'min:0'],
            'items.*.quantity_rejected' => ['nullable', 'numeric', 'min:0'],
            'items.*.rejection_reason' => ['nullable', 'string', 'max:2000'],
        ];
    }

    /**
     * Configure the validator instance.
     */
    public function withValidator(Validator $validator): void
    {
        $validator->after(function (Validator $validator): void {
            $this->assertItemsBelongToPurchaseOrder($validator, (int) $this->input('purchase_order_id'));
        });
    }

    /**
     * Ensure every submitted item references a purchase order line item that actually
     * belongs to the submitted purchase order.
     */
    private function assertItemsBelongToPurchaseOrder(Validator $validator, int $purchaseOrderId): void
    {
        $items = collect((array) $this->input('items', []));
        $itemIds = $items->pluck('purchase_order_item_id')->filter()->all();

        if ($itemIds === []) {
            return;
        }

        $validItemIds = PurchaseOrderItem::query()
            ->where('purchase_order_id', $purchaseOrderId)
            ->whereIn('id', $itemIds)
            ->pluck('id')
            ->all();

        $items->each(function (array $item, int $index) use ($validator, $validItemIds): void {
            if (isset($item['purchase_order_item_id']) && ! in_array((int) $item['purchase_order_item_id'], $validItemIds, true)) {
                $validator->errors()->add("items.{$index}.purchase_order_item_id", __('This item does not belong to the selected purchase order.'));
            }
        });
    }
}
