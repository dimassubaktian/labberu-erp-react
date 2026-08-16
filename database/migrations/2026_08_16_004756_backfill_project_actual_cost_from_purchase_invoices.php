<?php

use App\Models\Project;
use Illuminate\Database\Migrations\Migration;

return new class extends Migration
{
    /**
     * actual_cost previously held the approved quotation's BOM total, which is planned cost.
     * Restate every project so the column means what vendors have actually billed.
     */
    public function up(): void
    {
        Project::each(fn (Project $project) => $project->recomputeActualCost());
    }

    public function down(): void {}
};
