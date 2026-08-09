<?php

namespace App\Http\Requests;

use App\Models\GoodsReceiptNote;
use App\Models\GoodsReceiptNoteItem;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Validator;

class GoodsReceiptNoteConfirmRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        $goodsReceiptNote = $this->route('goodsReceiptNote');

        return $goodsReceiptNote instanceof GoodsReceiptNote
            && $goodsReceiptNote->status === 'draft';
    }

    protected function prepareForValidation(): void
    {
        $this->merge(['received_by_id' => auth()->user()?->workforce?->id]);
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'received_by_id' => ['required', 'integer', 'exists:workforces,id'],
        ];
    }

    /**
     * Configure the validator instance.
     */
    public function withValidator(Validator $validator): void
    {
        $validator->after(function (Validator $validator): void {
            $this->assertQuantitiesWithinRemaining($validator);
        });
    }

    /**
     * Final backstop before locking in accepted quantities: even though the store/update
     * requests already cap each line against what's remaining, two draft goods receipt notes
     * for the same purchase order line can each look valid on their own (remaining is only
     * computed from *confirmed* notes) and only conflict once both are confirmed. Re-check
     * here against every other already-confirmed note before this one locks in too.
     */
    private function assertQuantitiesWithinRemaining(Validator $validator): void
    {
        $goodsReceiptNote = $this->route('goodsReceiptNote');

        if (! $goodsReceiptNote instanceof GoodsReceiptNote) {
            return;
        }

        $goodsReceiptNote->loadMissing('items.purchaseOrderItem');

        $itemIds = $goodsReceiptNote->items->pluck('purchase_order_item_id')->filter()->all();

        if ($itemIds === []) {
            return;
        }

        $alreadyAccepted = GoodsReceiptNoteItem::query()
            ->whereIn('purchase_order_item_id', $itemIds)
            ->whereHas('goodsReceiptNote', fn ($query) => $query->where('status', 'confirmed'))
            ->selectRaw('purchase_order_item_id, sum(quantity_accepted) as accepted')
            ->groupBy('purchase_order_item_id')
            ->pluck('accepted', 'purchase_order_item_id');

        foreach ($goodsReceiptNote->items as $item) {
            if (! $item->purchaseOrderItem) {
                continue;
            }

            $remaining = max(0, (float) $item->purchaseOrderItem->quantity - (float) ($alreadyAccepted[$item->purchase_order_item_id] ?? 0));

            if ((float) $item->quantity_accepted > $remaining) {
                $validator->errors()->add(
                    'items',
                    __('This goods receipt note would accept more than remains on the purchase order — another confirmed note already covers it. Cancel or edit it first.'),
                );

                return;
            }
        }
    }
}
