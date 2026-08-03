<?php

namespace App\Http\Requests;

use App\Models\User;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Rules\Password;

class UserUpdateRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        /** @var User $user */
        $user = $this->route('user');

        if ($user->id !== auth()->id()) {
            return true;
        }

        if ($this->input('status') === 'inactive') {
            return false;
        }

        if ($this->has('roles') && empty($this->input('roles'))) {
            return false;
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
        /** @var User $user */
        $user = $this->route('user');

        return [
            'name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'email', 'max:255', Rule::unique('users', 'email')->ignore($user->id)->whereNull('deleted_at')],
            'password' => ['nullable', 'string', Password::default(), 'confirmed'],
            'status' => ['required', 'string', 'in:active,inactive'],
            'workforce_id' => [
                'nullable',
                Rule::exists('workforces', 'id')->where(fn ($query) => $query->whereNull('user_id')->orWhere('user_id', $user->id)),
            ],
            'roles' => ['array'],
            'roles.*' => [Rule::exists('roles', 'id')],
        ];
    }
}
