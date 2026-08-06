<?php

namespace App\Http\Requests;

use App\Models\DeliveryOrder;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;

class DeliveryOrderCancelRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        $deliveryOrder = $this->route('deliveryOrder');

        return $deliveryOrder instanceof DeliveryOrder
            && $deliveryOrder->status === 'confirmed';
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [];
    }
}
