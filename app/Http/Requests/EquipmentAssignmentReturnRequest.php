<?php

namespace App\Http\Requests;

use App\Models\EquipmentAssignment;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;

class EquipmentAssignmentReturnRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        $assignment = $this->route('assignment');

        return $assignment instanceof EquipmentAssignment && $assignment->returned_at === null;
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'status' => ['required', 'string', 'in:available,in_calibration,under_maintenance,retired,lost,damaged'],
            // Required whenever the tool isn't simply going back on the shelf as-is, so a
            // "damaged" or "lost" return always explains itself in the history.
            'notes' => ['nullable', 'string', 'max:2000', 'required_unless:status,available'],
        ];
    }
}
