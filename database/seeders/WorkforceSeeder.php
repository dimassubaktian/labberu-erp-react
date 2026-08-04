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
            ['name' => 'Super Admin', 'job_title' => 'Managing Director', 'gender' => 'male', 'user_email' => 'superadmin@labberu.test'],
            ['name' => 'Admin User', 'job_title' => 'Admin Manager', 'gender' => 'female', 'user_email' => 'admin@labberu.test'],
            ['name' => 'Manager User', 'job_title' => 'Operations Manager', 'gender' => 'male', 'user_email' => 'manager@labberu.test'],
            ['name' => 'Project Manager User', 'job_title' => 'Project Manager', 'gender' => 'male', 'user_email' => 'pm@labberu.test'],
            ['name' => 'HR User', 'job_title' => 'HR Manager', 'gender' => 'female', 'user_email' => 'hr@labberu.test'],
            ['name' => 'Finance User', 'job_title' => 'Finance Manager', 'gender' => 'female', 'user_email' => 'finance@labberu.test'],
            ['name' => 'Procurement User', 'job_title' => 'Procurement Manager', 'gender' => 'male', 'user_email' => 'procurement@labberu.test'],
            ['name' => 'Staff User', 'job_title' => 'Warehouse Staff', 'gender' => 'male', 'user_email' => 'staff@labberu.test'],
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
