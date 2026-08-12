<?php

namespace App\Http\Requests;

use App\Models\GoodsReceiptNote;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;

class GoodsReceiptNoteCancelRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        $goodsReceiptNote = $this->route('goodsReceiptNote');

        return $goodsReceiptNote instanceof GoodsReceiptNote
            && $goodsReceiptNote->status === 'confirmed';
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'cancel_reason' => ['required', 'string'],
        ];
    }
}
