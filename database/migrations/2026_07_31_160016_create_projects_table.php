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
        Schema::create('projects', function (Blueprint $table) {
            $table->id();
            $table->uuid()->unique();
            $table->string('project_code')->unique();
            $table->string('name');
            $table->foreignId('customer_id')->constrained();
            $table->date('request_date');
            $table->foreignId('person_in_charge_id')->nullable()->constrained('workforces');
            $table->text('description')->nullable();
            $table->string('status')->default('planning');
            $table->string('priority');
            $table->date('start_date')->nullable();
            $table->date('end_date')->nullable();
            $table->timestamp('completed_at')->nullable();
            $table->decimal('estimate_contract_value', 15, 2)->nullable();
            $table->decimal('estimate_cost', 15, 2)->nullable();
            $table->decimal('actual_cost', 15, 2)->nullable();
            $table->decimal('actual_contract_value', 15, 2)->nullable();
            $table->timestamps();
            $table->softDeletes();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('projects');
    }
};
