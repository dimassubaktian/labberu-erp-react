<?php

namespace Tests;

use App\Models\User;
use Database\Seeders\PermissionSeeder;
use Illuminate\Contracts\Auth\Authenticatable;
use Illuminate\Foundation\Testing\TestCase as BaseTestCase;
use Laravel\Fortify\Features;
use Spatie\Permission\Models\Permission;

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
     */
    public function actingAs(Authenticatable $user, $guard = null): static
    {
        if ($user instanceof User) {
            // Idempotent (findOrCreate) — always run so a test that creates one ad-hoc
            // permission before calling actingAs() still ends up with the full set, not just
            // the one it happened to create first.
            (new PermissionSeeder)->run();

            $user->syncPermissions(Permission::all());
        }

        return parent::actingAs($user, $guard);
    }
}
