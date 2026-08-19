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
        Schema::create('equipment_location_moves', function (Blueprint $table) {
            $table->id();
            $table->uuid()->unique();
            $table->foreignId('equipment_id')->constrained()->cascadeOnDelete();
            $table->foreignId('location_id')->constrained('equipment_locations');
            $table->dateTime('moved_at');
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
        Schema::dropIfExists('equipment_location_moves');
    }
};
