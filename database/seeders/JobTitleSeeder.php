<?php

namespace Database\Seeders;

use App\Models\JobTitle;
use Illuminate\Database\Seeder;

class JobTitleSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $titles = [
            'Managing Director',
            'Operations Manager',
            'Admin Manager',
            'HR Manager',
            'Finance Manager',
            'Procurement Manager',
            'Project Manager',
            'Electrical Engineer',
            'Mechanical Engineer',
            'Solar Installation Technician',
            'Panel Assembly Technician',
            'QA/QC Inspector',
            'Warehouse Staff',
        ];

        foreach ($titles as $title) {
            JobTitle::factory()->create([
                'name' => $title,
                'status' => 'active',
            ]);
        }
    }
}
