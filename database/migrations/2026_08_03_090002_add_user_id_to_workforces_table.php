<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     *
     * No DB-level foreign key constraint: SQLite has no ALTER TABLE ADD CONSTRAINT support, so
     * Laravel adds one by rebuilding the whole table — and that rebuild silently drops the WHERE
     * clause on `workforces_email_active_unique` (a partial index created via a raw DB::statement
     * in an earlier migration), turning it into a plain unique index. Referential integrity for
     * this optional link is enforced at the application layer (UserController/WorkforceController)
     * instead.
     */
    public function up(): void
    {
        Schema::table('workforces', function (Blueprint $table) {
            $table->unsignedBigInteger('user_id')->nullable()->after('id');
        });

        DB::statement('create unique index workforces_user_id_unique on workforces (user_id)');
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        DB::statement('DROP INDEX workforces_user_id_unique ON workforces');

        Schema::table('workforces', function (Blueprint $table) {
            $table->dropColumn('user_id');
        });
    }
};
