<?php

namespace App\Http\Requests;

use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class WorkforceStoreRequest extends FormRequest
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
            'full_name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'email', 'max:255', Rule::unique('workforces', 'email')->whereNull('deleted_at')],
            'phone' => ['nullable', 'string', 'max:30'],
            'address' => ['nullable', 'string', 'max:1000'],
            'job_title_id' => ['required', Rule::exists('job_titles', 'id')->whereNull('deleted_at')],
            'gender' => ['required', 'string', 'in:male,female'],
            'photo' => ['nullable', 'image', 'max:2048'],
            'status' => ['required', 'string', 'in:active,inactive'],
        ];
    }
}
