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
        Schema::create('purchase_orders', function (Blueprint $table) {
            $table->id();
            $table->uuid()->unique();
            $table->string('purchase_order_code')->unique();
            $table->foreignId('project_id')->constrained();
            $table->foreignId('quotation_id')->constrained();
            $table->foreignId('customer_id')->constrained();
            $table->foreignId('vendor_id')->constrained();
            $table->string('address')->nullable();
            $table->string('phone')->nullable();
            $table->string('fax')->nullable();
            $table->string('quotation_no')->nullable();
            $table->date('quotation_date')->nullable();
            $table->string('project_name');
            $table->date('date');
            $table->foreignId('currency_id')->constrained();
            $table->foreignId('tax_id')->nullable()->constrained();
            $table->string('shipping_method')->nullable();
            $table->string('shipping_terms')->nullable();
            $table->date('delivery_date')->nullable();
            $table->decimal('subtotal', 15, 2)->default(0);
            $table->decimal('discount_total', 15, 2)->default(0);
            $table->decimal('net_after_discount', 15, 2)->default(0);
            $table->decimal('tax_amount', 15, 2)->default(0);
            $table->decimal('grand_total', 15, 2)->default(0);
            $table->string('status')->default('draft');
            $table->string('progress')->nullable();
            $table->foreignId('issued_by_id')->nullable()->constrained('workforces');
            $table->timestamp('issued_at')->nullable();
            $table->foreignId('checked_by_1_id')->nullable()->constrained('workforces');
            $table->timestamp('checked_by_1_at')->nullable();
            $table->foreignId('checked_by_2_id')->nullable()->constrained('workforces');
            $table->timestamp('checked_by_2_at')->nullable();
            $table->foreignId('approved_by_id')->nullable()->constrained('workforces');
            $table->timestamp('approved_at')->nullable();
            $table->text('rejection_reason')->nullable();
            $table->timestamps();
            $table->softDeletes();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('purchase_orders');
    }
};
