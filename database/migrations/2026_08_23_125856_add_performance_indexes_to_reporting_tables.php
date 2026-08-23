<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Add indexes for the columns dashboards and listing pages filter and sort on. Every one of
     * these tables was previously scanned in full for status/date filters that hit on nearly
     * every request.
     */
    public function up(): void
    {
        Schema::table('invoices', function (Blueprint $table): void {
            $table->index(['status', 'payment_status']);
            $table->index('due_date');
            $table->index('invoice_date');
        });

        Schema::table('purchase_orders', function (Blueprint $table): void {
            $table->index('status');
            $table->index('date');
        });

        Schema::table('equipment_assignments', function (Blueprint $table): void {
            $table->index(['equipment_id', 'returned_at']);
        });

        Schema::table('projects', function (Blueprint $table): void {
            $table->index('status');
            $table->index('request_date');
        });
    }

    public function down(): void
    {
        Schema::table('invoices', function (Blueprint $table): void {
            $table->dropIndex(['status', 'payment_status']);
            $table->dropIndex(['due_date']);
            $table->dropIndex(['invoice_date']);
        });

        Schema::table('purchase_orders', function (Blueprint $table): void {
            $table->dropIndex(['status']);
            $table->dropIndex(['date']);
        });

        Schema::table('equipment_assignments', function (Blueprint $table): void {
            $table->dropIndex(['equipment_id', 'returned_at']);
        });

        Schema::table('projects', function (Blueprint $table): void {
            $table->dropIndex(['status']);
            $table->dropIndex(['request_date']);
        });
    }
};
