<?php

namespace App\Http\Requests;

use App\Models\Quotation;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class QuotationStatusUpdateRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        if (in_array($this->input('status'), ['approved', 'rejected'], true)) {
            return $this->user()?->can('quotations.approval') ?? false;
        }

        return true;
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        $quotation = $this->route('quotation');
        $allowed = $quotation instanceof Quotation ? Quotation::allowedNextStatuses($quotation->status) : [];

        return [
            'status' => ['required', 'string', Rule::in($allowed)],
            'cancel_reason' => [Rule::requiredIf($this->input('status') === 'cancelled'), 'nullable', 'string'],
        ];
    }
}
