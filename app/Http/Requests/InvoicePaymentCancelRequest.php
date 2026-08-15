<?php

namespace App\Http\Requests;

use App\Models\Invoice;
use App\Models\InvoicePayment;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;

class InvoicePaymentCancelRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        $invoice = $this->route('invoice');
        $payment = $this->route('payment');

        return $invoice instanceof Invoice
            && $invoice->status === 'issued'
            && $payment instanceof InvoicePayment
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
