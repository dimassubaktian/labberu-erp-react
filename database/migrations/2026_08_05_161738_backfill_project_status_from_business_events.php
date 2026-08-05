<?php

use App\Models\Project;
use Illuminate\Database\Migrations\Migration;

return new class extends Migration
{
    public function up(): void
    {
        Project::each(fn (Project $project) => $project->recomputeStatus());
    }

    public function down(): void {}
};
