<?php

namespace App\Http\Requests;

use App\Models\PurchaseInvoice;
use App\Models\PurchaseInvoicePayment;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;

class PurchaseInvoicePaymentCancelRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        $purchaseInvoice = $this->route('purchaseInvoice');
        $payment = $this->route('payment');

        return $purchaseInvoice instanceof PurchaseInvoice
            && $purchaseInvoice->status === 'issued'
            && $payment instanceof PurchaseInvoicePayment
            && $payment->cancelled_at === null;
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'cancel_reason' => ['required', 'string', 'max:2000'],
        ];
    }
}
