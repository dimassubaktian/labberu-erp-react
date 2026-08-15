<?php

namespace App\Http\Requests;

use App\Models\PurchaseInvoice;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class PurchaseInvoicePaymentStoreRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        $purchaseInvoice = $this->route('purchaseInvoice');

        return $purchaseInvoice instanceof PurchaseInvoice && $purchaseInvoice->status === 'issued';
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'amount' => ['required', 'numeric', 'min:0.01'],
            'payment_date' => ['required', 'date'],
            'method' => ['nullable', Rule::in(['Bank Transfer', 'Card', 'QRIS', 'Cash'])],
            'remarks' => ['nullable', 'string', 'max:2000'],
        ];
    }
}
