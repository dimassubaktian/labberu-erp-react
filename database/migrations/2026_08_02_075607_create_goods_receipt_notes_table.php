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
        Schema::create('goods_receipt_notes', function (Blueprint $table) {
            $table->id();
            $table->uuid()->unique();
            $table->string('grn_code')->unique();
            $table->foreignId('purchase_order_id')->constrained();
            $table->date('received_date');
            $table->text('remarks')->nullable();
            $table->string('status')->default('draft');
            $table->foreignId('received_by_id')->nullable()->constrained('workforces');
            $table->timestamp('received_at')->nullable();
            $table->timestamps();
            $table->softDeletes();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('goods_receipt_notes');
    }
};
