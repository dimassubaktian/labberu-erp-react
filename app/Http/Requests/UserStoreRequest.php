<?php

namespace App\Http\Requests;

use App\Concerns\PasswordValidationRules;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UserStoreRequest extends FormRequest
{
    use PasswordValidationRules;

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
            'email' => ['required', 'email', 'max:255', Rule::unique('users', 'email')->whereNull('deleted_at')],
            'password' => $this->passwordRules(),
            'status' => ['required', 'string', 'in:active,inactive'],
            'workforce_id' => [
                'nullable',
                Rule::exists('workforces', 'id')->where(fn ($query) => $query->whereNull('user_id')),
            ],
            'roles' => ['array'],
            'roles.*' => [Rule::exists('roles', 'id')],
        ];
    }
}
