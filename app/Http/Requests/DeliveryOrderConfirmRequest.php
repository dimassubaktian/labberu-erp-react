<?php

namespace App\Http\Requests;

use App\Models\DeliveryOrder;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;

class DeliveryOrderConfirmRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        $deliveryOrder = $this->route('deliveryOrder');

        return $deliveryOrder instanceof DeliveryOrder
            && $deliveryOrder->status === 'draft';
    }

    protected function prepareForValidation(): void
    {
        $this->merge(['delivered_by_id' => auth()->user()?->workforce?->id]);
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'delivered_by_id' => ['required', 'integer', 'exists:workforces,id'],
            'signed_document' => ['required', 'file', 'mimes:pdf,jpg,jpeg,png', 'max:10240'],
        ];
    }
}
