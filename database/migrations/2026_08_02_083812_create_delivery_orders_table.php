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
        Schema::create('delivery_orders', function (Blueprint $table) {
            $table->id();
            $table->uuid()->unique();
            $table->string('do_code')->unique();
            $table->foreignId('quotation_id')->constrained();
            $table->date('delivery_date');
            $table->text('remarks')->nullable();
            $table->string('status')->default('draft');
            $table->foreignId('delivered_by_id')->nullable()->constrained('workforces');
            $table->timestamp('delivered_at')->nullable();
            $table->timestamps();
            $table->softDeletes();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('delivery_orders');
    }
};
