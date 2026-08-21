<?php

namespace App\Http\Requests;

use App\Models\Equipment;
use App\Models\Project;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Support\Carbon;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Validator;

class EquipmentAssignmentStoreRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request. Only available equipment can be
     * checked out, mirroring the picker in EquipmentController::search().
     */
    public function authorize(): bool
    {
        $equipment = $this->route('equipment');

        return $equipment instanceof Equipment && $equipment->status === 'available';
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'project_id' => ['nullable', Rule::exists('projects', 'id')->whereNull('deleted_at')],
            'custodian_id' => ['nullable', Rule::exists('workforces', 'id')->whereNull('deleted_at')],
            'checked_out_at' => ['required', 'date'],
            'expected_return_at' => ['nullable', 'date', 'after_or_equal:checked_out_at'],
            'notes' => ['nullable', 'string', 'max:2000'],
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
     * Reject the checkout if the target project requires more recently calibrated equipment
     * than this equipment's calibration history can show.
     */
    private function assertCalibrationRecency(Validator $validator): void
    {
        $projectId = $this->input('project_id');

        if (! $projectId) {
            return;
        }

        $project = Project::query()->find($projectId);
        $equipment = $this->route('equipment');

        if (! $project || ! $equipment instanceof Equipment || $project->equipment_calibration_max_age_months === null) {
            return;
        }

        $checkedOutAt = $this->input('checked_out_at') ? Carbon::parse($this->input('checked_out_at')) : now();

        if (! $equipment->satisfiesCalibrationRecency($project->equipment_calibration_max_age_months, $checkedOutAt)) {
            $validator->errors()->add('project_id', __('This project requires equipment calibrated within the last :months month(s). This equipment does not meet that requirement.', ['months' => $project->equipment_calibration_max_age_months]));
        }
    }
}
