<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     *
     * Mirrors purchase_orders.exchange_rate on the revenue side. Invoices have no currency of
     * their own — they inherit the quotation's — so this one rate converts a quotation, its
     * invoices and their payments into the base currency for cross-project reporting.
     */
    public function up(): void
    {
        Schema::table('quotations', function (Blueprint $table) {
            $table->decimal('exchange_rate', 18, 6)->default(1)->after('currency_id');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('quotations', function (Blueprint $table) {
            $table->dropColumn('exchange_rate');
        });
    }
};
