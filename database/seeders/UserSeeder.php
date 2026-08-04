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
            ['name' => 'Super Admin', 'email' => 'superadmin@labberu.test', 'role' => 'Super Admin'],
            ['name' => 'Admin User', 'email' => 'admin@labberu.test', 'role' => 'Admin'],
            ['name' => 'Manager User', 'email' => 'manager@labberu.test', 'role' => 'Manager'],
            ['name' => 'Project Manager User', 'email' => 'pm@labberu.test', 'role' => 'Project Manager'],
            ['name' => 'HR User', 'email' => 'hr@labberu.test', 'role' => 'HR'],
            ['name' => 'Finance User', 'email' => 'finance@labberu.test', 'role' => 'Finance'],
            ['name' => 'Procurement User', 'email' => 'procurement@labberu.test', 'role' => 'Procurement'],
            ['name' => 'Staff User', 'email' => 'staff@labberu.test', 'role' => 'Staff'],
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
