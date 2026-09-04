<?php

namespace App\Http\Requests;

use App\Models\DeliveryOrder;
use App\Services\DeliveryOrderQuantityValidator;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Validator;

class DeliveryOrderConfirmRequest extends FormRequest
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
        $deliveryOrder = $this->route('deliveryOrder');

        return $deliveryOrder instanceof DeliveryOrder
            && $deliveryOrder->status === 'draft';
    }

    protected function prepareForValidation(): void
    {
        $this->merge(['delivered_by_id' => auth()->user()?->workforce?->id]);
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'delivered_by_id' => ['required', 'integer', 'exists:workforces,id'],
            'signed_document' => ['required', 'file', 'mimes:pdf,jpg,jpeg,png', 'max:10240'],
        ];
    }

    /**
     * Ensure this draft still fits within its quotation line quotas before it is confirmed.
     *
     * @return array<int, callable>
     */
    public function after(): array
    {
        return [function (Validator $validator): void {
            $deliveryOrder = $this->route('deliveryOrder');

            if (! $deliveryOrder instanceof DeliveryOrder) {
                return;
            }

            $deliveryOrder->loadMissing(['quotation', 'items']);
            $items = $deliveryOrder->items
                ->map(fn ($item): array => [
                    'quotation_item_id' => $item->quotation_item_id,
                    'quantity_delivered' => $item->quantity_delivered,
                ])
                ->all();

            foreach ($this->quantityValidator->errorsFor($deliveryOrder->quotation, $items, $deliveryOrder) as $message) {
                $validator->errors()->add('items', $message);
            }
        }];
    }
}
