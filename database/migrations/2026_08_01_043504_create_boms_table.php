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
        Schema::create('boms', function (Blueprint $table) {
            $table->id();
            $table->uuid()->unique();
            $table->foreignId('quotation_id')->unique()->constrained()->cascadeOnDelete();
            $table->text('remarks')->nullable();
            $table->decimal('main_cost', 15, 2)->default(0);
            $table->decimal('overhead_percentage', 5, 2)->nullable();
            $table->decimal('overhead_cost', 15, 2)->default(0);
            $table->decimal('total_cost', 15, 2)->default(0);
            $table->decimal('selling_percentage', 5, 2)->nullable();
            $table->decimal('selling_cost', 15, 2)->default(0);
            $table->timestamps();
            $table->softDeletes();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('boms');
    }
};
