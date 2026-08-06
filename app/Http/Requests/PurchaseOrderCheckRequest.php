<?php

namespace App\Http\Requests;

use App\Models\PurchaseOrder;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;

class PurchaseOrderCheckRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        $purchaseOrder = $this->route('purchaseOrder');

        if (! $purchaseOrder instanceof PurchaseOrder || $purchaseOrder->status !== 'issued') {
            return false;
        }

        $slot = (int) $this->input('slot');

        return match ($slot) {
            1 => $purchaseOrder->checked_by_1_id === null,
            2 => $purchaseOrder->checked_by_2_id === null,
            default => false,
        };
    }

    protected function prepareForValidation(): void
    {
        $this->merge(['checked_by_id' => auth()->user()?->workforce?->id]);
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'slot' => ['required', 'integer', 'in:1,2'],
            'checked_by_id' => ['required', 'integer', 'exists:workforces,id'],
        ];
    }
}
