<?php

namespace App\Http\Requests;

use App\Models\Quotation;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class QuotationProgressUpdateRequest extends FormRequest
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
        $quotation = $this->route('quotation');
        $allowed = $quotation instanceof Quotation && $quotation->status === 'approved'
            ? Quotation::allowedNextProgress($quotation->progress)
            : [];

        return [
            'progress' => ['required', 'string', Rule::in($allowed)],
        ];
    }
}
