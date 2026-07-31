<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('workforces', function (Blueprint $table) {
            $table->dropUnique(['email']);
        });

        DB::statement('create unique index workforces_email_active_unique on workforces (email) where deleted_at is null');
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        DB::statement('drop index workforces_email_active_unique');

        Schema::table('workforces', function (Blueprint $table) {
            $table->unique('email');
        });
    }
};
