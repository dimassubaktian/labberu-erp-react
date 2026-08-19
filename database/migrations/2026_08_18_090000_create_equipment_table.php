<?php

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
        Schema::create('equipment', function (Blueprint $table) {
            $table->id();
            $table->uuid()->unique();
            $table->string('equipment_code')->unique();
            $table->string('name');
            $table->string('category')->nullable();
            $table->string('model_type')->nullable();
            $table->string('serial_number')->nullable()->unique();
            $table->string('brand')->nullable();
            $table->string('picture')->nullable();
            $table->date('purchase_date')->nullable();
            $table->decimal('purchase_cost', 12, 2)->nullable();
            $table->foreignId('vendor_id')->nullable()->constrained()->nullOnDelete();
            $table->date('warranty_expiry_date')->nullable();
            $table->boolean('calibration_required')->default(true);
            $table->unsignedSmallInteger('calibration_interval_months')->nullable();
            $table->date('next_calibration_due_date')->nullable();
            $table->string('status')->default('available');
            $table->foreignId('current_project_id')->nullable()->constrained('projects')->nullOnDelete();
            $table->foreignId('current_custodian_id')->nullable()->constrained('workforces')->nullOnDelete();
            $table->text('remarks')->nullable();
            $table->timestamps();
            $table->softDeletes();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('equipment');
    }
};
