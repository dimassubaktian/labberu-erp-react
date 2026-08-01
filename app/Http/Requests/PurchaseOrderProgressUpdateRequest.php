<?php

namespace App\Http\Requests;

use App\Models\PurchaseOrder;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class PurchaseOrderProgressUpdateRequest extends FormRequest
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
        $purchaseOrder = $this->route('purchaseOrder');
        $allowed = $purchaseOrder instanceof PurchaseOrder && $purchaseOrder->status === 'approved'
            ? PurchaseOrder::allowedNextProgress($purchaseOrder->progress)
            : [];

        return [
            'progress' => ['required', 'string', Rule::in($allowed)],
        ];
    }
}
