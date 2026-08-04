<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Str;

class DatabaseSeeder extends Seeder
{
    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        $this->call([
            PermissionSeeder::class,
            RoleSeeder::class,
            CurrencySeeder::class,
            TaxSeeder::class,
            JobTitleSeeder::class,
            UserSeeder::class,
            WorkforceSeeder::class,
            ProductSeeder::class,
            VendorSeeder::class,
            CustomerSeeder::class,
        ]);

        // User::factory(10)->create();

        $user = User::factory()->create([
            'uuid' => (string) Str::uuid(),
            'name' => 'Test User',
            'email' => 'test@example.com',
        ]);

        $user->assignRole('Super Admin');

        // Any account created before RBAC was wired up (e.g. a developer's own login) has no
        // role yet — grant Super Admin so seeding this doesn't lock anyone out of their own app.
        User::doesntHave('roles')->get()->each(fn (User $existingUser) => $existingUser->assignRole('Super Admin'));
    }
}
