<?php

namespace App\Http\Requests;

use App\Models\PurchaseInvoice;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Contracts\Validation\Validator;
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
            'proof_of_payment' => ['nullable', 'file', 'mimes:pdf,jpg,jpeg,png', 'max:10240'],
        ];
    }

    /**
     * Reject payments that would exceed the purchase invoice's remaining balance.
     */
    public function withValidator(Validator $validator): void
    {
        $validator->after(function (Validator $validator): void {
            if ($validator->errors()->has('amount') || ! is_numeric($this->input('amount'))) {
                return;
            }

            /** @var PurchaseInvoice $purchaseInvoice */
            $purchaseInvoice = $this->route('purchaseInvoice');
            $totalPaid = (float) $purchaseInvoice->payments()->whereNull('cancelled_at')->sum('amount');
            $remaining = (float) $purchaseInvoice->total - $totalPaid;

            if ((float) $this->input('amount') > $remaining) {
                $validator->errors()->add('amount', __('Amount cannot exceed the remaining balance of :remaining.', ['remaining' => number_format($remaining, 2)]));
            }
        });
    }
}
