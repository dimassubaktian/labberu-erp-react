<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     *
     * The rate converts this purchase order's currency into the base currency, snapshotted at
     * creation so a project's spend can be totalled across purchase orders raised in different
     * currencies without restating history when rates move. Base-currency orders keep 1.
     */
    public function up(): void
    {
        Schema::table('purchase_orders', function (Blueprint $table) {
            $table->decimal('exchange_rate', 18, 6)->default(1)->after('currency_id');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('purchase_orders', function (Blueprint $table) {
            $table->dropColumn('exchange_rate');
        });
    }
};
