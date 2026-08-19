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
        Schema::create('equipment_calibrations', function (Blueprint $table) {
            $table->id();
            $table->uuid()->unique();
            $table->foreignId('equipment_id')->constrained()->cascadeOnDelete();
            $table->string('certificate_number')->nullable();
            $table->date('calibration_date');
            $table->date('due_date');
            $table->foreignId('provider_id')->nullable()->constrained('vendors')->nullOnDelete();
            $table->string('result')->default('passed');
            $table->string('certificate_file')->nullable();
            $table->decimal('cost', 12, 2)->nullable();
            $table->text('notes')->nullable();
            $table->foreignId('created_by')->constrained('users');
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('equipment_calibrations');
    }
};
