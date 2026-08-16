<?php

use App\Models\PaymentTermTemplate;
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
        Schema::table('invoices', function (Blueprint $table) {
            $table->foreignId('payment_term_template_id')->nullable()->after('remarks')->constrained('payment_term_templates')->nullOnDelete();
            $table->longText('payment_terms_html')->nullable()->after('payment_term_template_id');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('invoices', function (Blueprint $table) {
            $table->dropColumn('payment_terms_html');
            $table->dropForeignIdFor(PaymentTermTemplate::class);
        });
    }
};
