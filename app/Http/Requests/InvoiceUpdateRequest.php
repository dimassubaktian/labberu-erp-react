<?php

namespace App\Http\Requests;

use App\Models\Invoice;
use App\Models\QuotationItem;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Validator;

class InvoiceUpdateRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        $invoice = $this->route('invoice');

        return $invoice instanceof Invoice && $invoice->status === 'draft';
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        $invoice = $this->route('invoice');

        return [
            'quotation_id' => [
                'required',
                Rule::exists('quotations', 'id')->whereNull('deleted_at'),
                Rule::in([$invoice instanceof Invoice ? $invoice->quotation_id : null]),
            ],
            'invoice_date' => ['required', 'date'],
            'due_date' => ['required', 'date'],
            'remarks' => ['nullable', 'string', 'max:2000'],
            'discount_type' => ['nullable', 'string', 'in:percentage,fixed'],
            'discount_value' => ['nullable', 'numeric', 'min:0', 'required_with:discount_type'],
            'tax_id' => ['nullable', Rule::exists('taxes', 'id')->whereNull('deleted_at')],
            'items' => ['required', 'array', 'min:1'],
            'items.*.quotation_item_id' => ['required', Rule::exists('quotation_items', 'id')],
            'items.*.quantity_invoiced' => ['required', 'numeric', 'min:0.01'],
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
