<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Str;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->uuid()->nullable()->unique()->after('id');
            $table->string('status')->default('active')->after('password');
            $table->softDeletes();
        });

        DB::table('users')->whereNull('uuid')->orderBy('id')->each(function ($user): void {
            DB::table('users')->where('id', $user->id)->update(['uuid' => (string) Str::uuid()]);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropSoftDeletes();
            $table->dropColumn(['uuid', 'status']);
        });
    }
};
