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
        Schema::create('currencies', function (Blueprint $table) {
            $table->id();
            $table->uuid()->unique();
            $table->string('iso_code');
            $table->string('name');
            $table->string('symbol')->nullable();
            $table->string('status')->default('active');
            $table->timestamps();
            $table->softDeletes();
        });

        if (DB::getDriverName() === 'mysql') {
            // MySQL does not support partial indexes. A virtual generated column bridges the gap:
            // active rows key on iso_code (enforcing uniqueness), deleted rows key on the always-unique uuid.
            DB::statement('ALTER TABLE currencies ADD COLUMN iso_code_unique_key VARCHAR(255) GENERATED ALWAYS AS (IF(deleted_at IS NULL, iso_code, uuid)) VIRTUAL');
            DB::statement('CREATE UNIQUE INDEX currencies_iso_code_active_unique ON currencies (iso_code_unique_key)');
        } else {
            // SQLite supports expression indexes directly.
            DB::statement('CREATE UNIQUE INDEX currencies_iso_code_active_unique ON currencies (CASE WHEN deleted_at IS NULL THEN iso_code ELSE uuid END)');
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('currencies');
    }
};
