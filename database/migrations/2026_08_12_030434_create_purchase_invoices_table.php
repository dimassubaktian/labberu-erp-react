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
        Schema::create('purchase_invoices', function (Blueprint $table) {
            $table->id();
            $table->uuid()->unique();
            $table->string('purchase_invoice_code')->unique();
            $table->foreignId('purchase_order_id')->constrained();
            $table->date('invoice_date');
            $table->date('due_date');
            $table->text('remarks')->nullable();
            $table->string('discount_type')->nullable();
            $table->decimal('discount_value', 15, 2)->nullable();
            $table->foreignId('tax_id')->nullable()->constrained();
            $table->decimal('subtotal', 15, 2)->default(0);
            $table->decimal('discount_amount', 15, 2)->default(0);
            $table->decimal('tax_amount', 15, 2)->default(0);
            $table->decimal('total', 15, 2)->default(0);
            $table->string('status')->default('draft');
            $table->string('payment_status')->nullable();
            $table->timestamp('issued_at')->nullable();
            $table->timestamps();
            $table->softDeletes();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('purchase_invoices');
    }
};
