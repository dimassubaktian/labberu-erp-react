<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;

class UserSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $demoUsers = [
            ['name' => 'Hartono Wibowo', 'email' => 'superadmin@labberu.test', 'role' => 'Super Admin'],
            ['name' => 'Siti Rahayu', 'email' => 'admin@labberu.test', 'role' => 'Admin'],
            ['name' => 'Joko Susanto', 'email' => 'manager@labberu.test', 'role' => 'Manager'],
            ['name' => 'Arief Kurniawan', 'email' => 'pm@labberu.test', 'role' => 'Project Manager'],
            ['name' => 'Ratna Dewi', 'email' => 'hr@labberu.test', 'role' => 'HR'],
            ['name' => 'Indah Permatasari', 'email' => 'finance@labberu.test', 'role' => 'Finance'],
            ['name' => 'Teguh Santosa', 'email' => 'procurement@labberu.test', 'role' => 'Procurement'],
            ['name' => 'Dedi Firmansyah', 'email' => 'staff@labberu.test', 'role' => 'Staff'],
        ];

        foreach ($demoUsers as $demoUser) {
            $user = User::factory()->create([
                'name' => $demoUser['name'],
                'email' => $demoUser['email'],
            ]);

            $user->assignRole($demoUser['role']);
        }
    }
}
