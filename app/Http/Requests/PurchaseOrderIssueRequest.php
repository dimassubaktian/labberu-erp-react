<?php

namespace App\Http\Requests;

use App\Models\PurchaseOrder;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;

class PurchaseOrderIssueRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        $purchaseOrder = $this->route('purchaseOrder');

        return $purchaseOrder instanceof PurchaseOrder
            && $purchaseOrder->status === 'draft';
    }

    protected function prepareForValidation(): void
    {
        $this->merge(['issued_by_id' => auth()->user()?->workforce?->id]);
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'issued_by_id' => ['required', 'integer', 'exists:workforces,id'],
        ];
    }
}
