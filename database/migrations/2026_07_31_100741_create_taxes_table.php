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
        Schema::create('taxes', function (Blueprint $table) {
            $table->id();
            $table->uuid()->unique();
            $table->string('name');
            $table->string('code');
            $table->decimal('rate', 8, 2);
            $table->string('type');
            $table->timestamps();
            $table->softDeletes();
        });

        if (DB::getDriverName() === 'mysql') {
            // MySQL does not support partial indexes. A virtual generated column bridges the gap:
            // active rows key on code (enforcing uniqueness), deleted rows key on the always-unique uuid.
            DB::statement('ALTER TABLE taxes ADD COLUMN code_unique_key VARCHAR(255) GENERATED ALWAYS AS (IF(deleted_at IS NULL, code, uuid)) VIRTUAL');
            DB::statement('CREATE UNIQUE INDEX taxes_code_active_unique ON taxes (code_unique_key)');
        } else {
            // SQLite supports expression indexes directly.
            DB::statement('CREATE UNIQUE INDEX taxes_code_active_unique ON taxes (CASE WHEN deleted_at IS NULL THEN code ELSE uuid END)');
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('taxes');
    }
};
