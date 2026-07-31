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
        Schema::create('quotations', function (Blueprint $table) {
            $table->id();
            $table->uuid()->unique();
            $table->string('quotation_code');
            $table->foreignId('project_id')->constrained();
            $table->unsignedInteger('thread_number');
            $table->foreignId('root_quotation_id')->nullable()->constrained('quotations');
            $table->unsignedInteger('version_major')->default(1);
            $table->unsignedInteger('version_minor')->default(0);
            $table->boolean('is_current')->default(true);
            $table->string('status')->default('draft');
            $table->foreignId('currency_id')->constrained();
            $table->date('valid_until')->nullable();
            $table->string('discount_type')->nullable();
            $table->decimal('discount_value', 15, 2)->nullable();
            $table->foreignId('tax_id')->nullable()->constrained();
            $table->decimal('subtotal', 15, 2)->default(0);
            $table->decimal('discount_amount', 15, 2)->default(0);
            $table->decimal('tax_amount', 15, 2)->default(0);
            $table->decimal('total', 15, 2)->default(0);
            $table->text('remarks')->nullable();
            $table->foreignId('approved_by')->nullable()->constrained('users');
            $table->timestamp('approved_at')->nullable();
            $table->timestamps();
            $table->softDeletes();

            $table->unique(['quotation_code', 'version_major', 'version_minor']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('quotations');
    }
};
