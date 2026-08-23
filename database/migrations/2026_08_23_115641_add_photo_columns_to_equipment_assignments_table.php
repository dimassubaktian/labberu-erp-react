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
        Schema::table('equipment_assignments', function (Blueprint $table) {
            $table->string('checkout_photo')->nullable()->after('notes');
            $table->string('return_photo')->nullable()->after('checkout_photo');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('equipment_assignments', function (Blueprint $table) {
            $table->dropColumn(['checkout_photo', 'return_photo']);
        });
    }
};
