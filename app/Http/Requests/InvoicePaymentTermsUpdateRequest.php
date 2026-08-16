<?php

namespace App\Http\Requests;

use App\Models\Invoice;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class InvoicePaymentTermsUpdateRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     *
     * Payment terms stay editable after the invoice is issued, unlike the rest of the
     * invoice, so that wrong terms can be corrected without voiding the document.
     */
    public function authorize(): bool
    {
        return $this->route('invoice') instanceof Invoice;
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'payment_term_template_id' => ['nullable', Rule::exists('payment_term_templates', 'id')->whereNull('deleted_at')],
            'payment_terms_html' => ['nullable', 'string'],
        ];
    }
}
