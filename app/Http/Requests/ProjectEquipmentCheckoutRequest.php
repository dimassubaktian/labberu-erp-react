<?php

namespace App\Http\Requests;

use App\Models\Equipment;
use App\Models\Project;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Support\Carbon;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Validator;

class ProjectEquipmentCheckoutRequest extends FormRequest
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
            'equipment_id' => ['required', Rule::exists('equipment', 'id')->where('status', 'available')->whereNull('deleted_at')],
            'custodian_id' => ['nullable', Rule::exists('workforces', 'id')->whereNull('deleted_at')],
            'checked_out_at' => ['required', 'date'],
            'expected_return_at' => ['nullable', 'date', 'after_or_equal:checked_out_at'],
            'notes' => ['nullable', 'string', 'max:2000'],
            'checkout_photo' => ['nullable', 'file', 'max:10240', 'mimes:png,jpg,jpeg'],
        ];
    }

    /**
     * Configure the validator instance.
     */
    public function withValidator(Validator $validator): void
    {
        $validator->after(function (Validator $validator): void {
            $this->assertCalibrationRecency($validator);
        });
    }

    /**
     * Reject the checkout if this project requires more recently calibrated equipment than the
     * selected tool's calibration history can show.
     */
    private function assertCalibrationRecency(Validator $validator): void
    {
        /** @var Project $project */
        $project = $this->route('project');

        if ($project->equipment_calibration_max_age_months === null) {
            return;
        }

        $equipment = Equipment::query()->find($this->input('equipment_id'));

        if (! $equipment) {
            return;
        }

        $checkedOutAt = $this->input('checked_out_at') ? Carbon::parse($this->input('checked_out_at')) : now();

        if (! $equipment->satisfiesCalibrationRecency($project->equipment_calibration_max_age_months, $checkedOutAt)) {
            $validator->errors()->add('equipment_id', __('This project requires equipment calibrated within the last :months month(s). This equipment does not meet that requirement.', ['months' => $project->equipment_calibration_max_age_months]));
        }
    }
}
