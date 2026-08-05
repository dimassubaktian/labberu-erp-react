<?php

use App\Models\Project;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('projects', function (Blueprint $table) {
            if (! Schema::hasColumn('projects', 'sales_status')) {
                $table->string('sales_status')->nullable()->after('status');
            }

            if (! Schema::hasColumn('projects', 'po_status')) {
                $table->string('po_status')->nullable()->after('sales_status');
            }

            if (! Schema::hasColumn('projects', 'billing_status')) {
                $table->string('billing_status')->nullable()->after('po_status');
            }
        });

        Project::each(function (Project $project): void {
            $project->recomputeSalesStatus();
            $project->recomputePoStatus();
            $project->recomputeBillingStatus();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('projects', function (Blueprint $table) {
            $table->dropColumn(['sales_status', 'po_status', 'billing_status']);
        });
    }
};
