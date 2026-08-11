<?php

namespace Database\Seeders;

use App\Models\JobTitle;
use App\Models\User;
use App\Models\Workforce;
use Illuminate\Database\Seeder;

class WorkforceSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $linkedWorkforces = [
            ['name' => 'Hartono Wibowo', 'job_title' => 'Managing Director', 'gender' => 'male', 'user_email' => 'superadmin@labberu.test'],
            ['name' => 'Siti Rahayu', 'job_title' => 'Admin Manager', 'gender' => 'female', 'user_email' => 'admin@labberu.test'],
            ['name' => 'Joko Susanto', 'job_title' => 'Operations Manager', 'gender' => 'male', 'user_email' => 'manager@labberu.test'],
            ['name' => 'Arief Kurniawan', 'job_title' => 'Project Manager', 'gender' => 'male', 'user_email' => 'pm@labberu.test'],
            ['name' => 'Ratna Dewi', 'job_title' => 'HR Manager', 'gender' => 'female', 'user_email' => 'hr@labberu.test'],
            ['name' => 'Indah Permatasari', 'job_title' => 'Finance Manager', 'gender' => 'female', 'user_email' => 'finance@labberu.test'],
            ['name' => 'Teguh Santosa', 'job_title' => 'Procurement Manager', 'gender' => 'male', 'user_email' => 'procurement@labberu.test'],
            ['name' => 'Dedi Firmansyah', 'job_title' => 'Warehouse Staff', 'gender' => 'male', 'user_email' => 'staff@labberu.test'],
        ];

        foreach ($linkedWorkforces as $workforce) {
            $jobTitle = JobTitle::where('name', $workforce['job_title'])->firstOrFail();
            $user = User::where('email', $workforce['user_email'])->firstOrFail();

            Workforce::factory()->create([
                'full_name' => $workforce['name'],
                'job_title_id' => $jobTitle->id,
                'gender' => $workforce['gender'],
                'user_id' => $user->id,
            ]);
        }

        $unlinkedTitles = [
            'Electrical Engineer',
            'Electrical Engineer',
            'Mechanical Engineer',
            'Mechanical Engineer',
            'Solar Installation Technician',
            'Solar Installation Technician',
            'Solar Installation Technician',
            'Panel Assembly Technician',
            'Panel Assembly Technician',
            'Panel Assembly Technician',
            'QA/QC Inspector',
            'Warehouse Staff',
        ];

        foreach ($unlinkedTitles as $title) {
            $jobTitle = JobTitle::where('name', $title)->firstOrFail();

            Workforce::factory()->create([
                'job_title_id' => $jobTitle->id,
            ]);
        }
    }
}
