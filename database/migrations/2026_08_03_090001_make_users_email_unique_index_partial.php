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
        Schema::table('users', function (Blueprint $table) {
            $table->dropUnique(['email']);
        });

        if (DB::getDriverName() === 'mysql') {
            // MySQL does not support partial indexes. A virtual generated column bridges the gap:
            // active rows key on email (enforcing uniqueness), deleted rows key on the always-unique uuid.
            DB::statement('ALTER TABLE users ADD COLUMN email_unique_key VARCHAR(255) GENERATED ALWAYS AS (IF(deleted_at IS NULL, email, uuid)) VIRTUAL');
            DB::statement('CREATE UNIQUE INDEX users_email_active_unique ON users (email_unique_key)');
        } else {
            // SQLite supports expression indexes directly.
            DB::statement('CREATE UNIQUE INDEX users_email_active_unique ON users (CASE WHEN deleted_at IS NULL THEN email ELSE uuid END)');
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        if (DB::getDriverName() === 'mysql') {
            DB::statement('DROP INDEX users_email_active_unique ON users');
            DB::statement('ALTER TABLE users DROP COLUMN email_unique_key');
        } else {
            DB::statement('DROP INDEX users_email_active_unique');
        }

        Schema::table('users', function (Blueprint $table) {
            $table->unique('email');
        });
    }
};
