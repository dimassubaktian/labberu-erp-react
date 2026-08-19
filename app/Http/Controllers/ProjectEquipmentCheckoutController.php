<?php

namespace App\Http\Controllers;

use App\Http\Requests\ProjectEquipmentCheckoutRequest;
use App\Models\Equipment;
use App\Models\Project;
use Illuminate\Http\RedirectResponse;
use Inertia\Inertia;

class ProjectEquipmentCheckoutController extends Controller
{
    /**
     * Check out an available piece of equipment to the specified project.
     */
    public function store(ProjectEquipmentCheckoutRequest $request, Project $project): RedirectResponse
    {
        $data = $request->validated();
        $equipment = Equipment::findOrFail($data['equipment_id']);
        unset($data['equipment_id']);

        $data['project_id'] = $project->id;
        $data['created_by'] = $request->user()->id;

        $equipment->checkOut($data);

        Inertia::flash('toast', ['type' => 'success', 'message' => __('Equipment checked out.')]);

        return to_route('projects.show', $project);
    }
}
