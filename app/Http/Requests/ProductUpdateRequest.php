<?php

namespace App\Http\Requests;

use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;

class ProductUpdateRequest extends FormRequest
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
        return [
            'name' => ['required', 'string', 'max:255'],
            'reference_number' => ['required', 'string', 'max:100'],
            'descriptions' => ['required', 'string', 'max:2000'],
            'brand' => ['required', 'string', 'in:Schneider Electric,ABB,Siemens,Legrand,Mitsubishi Electric,Omron,Fuji Electric,LS Electric,Hager,Chint,Other'],
            'unit' => ['required', 'string', 'in:Pcs,Unit,Set,Box,Roll,Meter,Kg,Liter,Pack,Other'],
            'type' => ['required', 'string', 'in:goods,service'],
            'price' => ['nullable', 'numeric', 'min:0'],
            'cost' => ['nullable', 'numeric', 'min:0'],
            'status' => ['required', 'string', 'in:active,inactive'],
        ];
    }
}
