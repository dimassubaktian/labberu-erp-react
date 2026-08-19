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
        Schema::create('equipment_assignments', function (Blueprint $table) {
            $table->id();
            $table->uuid()->unique();
            $table->foreignId('equipment_id')->constrained()->cascadeOnDelete();
            $table->foreignId('project_id')->nullable()->constrained()->nullOnDelete();
            $table->foreignId('custodian_id')->nullable()->constrained('workforces')->nullOnDelete();
            $table->dateTime('checked_out_at');
            $table->date('expected_return_at')->nullable();
            $table->dateTime('returned_at')->nullable();
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
        Schema::dropIfExists('equipment_assignments');
    }
};
