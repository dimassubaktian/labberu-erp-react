<?php

namespace Tests;

use App\Models\User;
use Illuminate\Contracts\Auth\Authenticatable;
use Illuminate\Foundation\Testing\TestCase as BaseTestCase;
use Illuminate\Support\Facades\DB;
use Laravel\Fortify\Features;
use Spatie\Permission\PermissionRegistrar;

abstract class TestCase extends BaseTestCase
{
    protected function skipUnlessFortifyHas(string $feature, ?string $message = null): void
    {
        if (! Features::enabled($feature)) {
            $this->markTestSkipped($message ?? "Fortify feature [{$feature}] is not enabled.");
        }
    }

    /**
     * Every route in this app is gated by a permission. Existing tests were written before RBAC
     * existed and assume the acting user can do anything, so grant every permission by default —
     * tests that need a deliberately limited user call `$user->syncPermissions([...])` afterwards.
     *
     * Bulk inserts instead of Spatie's `findOrCreate`/`syncPermissions` (one query per
     * permission, ~100+ of them): this runs on every `actingAs()` call because RefreshDatabase
     * rolls back each test's transaction, so the seeded permissions can't carry over to the next
     * test. That per-row overhead was the largest single cost in the suite.
     */
    public function actingAs(Authenticatable $user, $guard = null): static
    {
        if ($user instanceof User) {
            $now = now();

            $rows = collect(require database_path('data/permissions.php'))
                ->flatMap(fn (array $actions, string $module) => collect($actions)
                    ->map(fn (string $action) => [
                        'name' => "{$module}.{$action}",
                        'guard_name' => 'web',
                        'created_at' => $now,
                        'updated_at' => $now,
                    ]))
                ->all();

            DB::table('permissions')->insertOrIgnore($rows);

            $permissionIds = DB::table('permissions')->pluck('id');

            DB::table('model_has_permissions')->insertOrIgnore(
                $permissionIds->map(fn (int $id) => [
                    'permission_id' => $id,
                    'model_type' => $user->getMorphClass(),
                    'model_id' => $user->id,
                ])->all()
            );

            app(PermissionRegistrar::class)->forgetCachedPermissions();
        }

        return parent::actingAs($user, $guard);
    }
}
