<?php

namespace Database\Seeders;

use App\Models\Tax;
use Illuminate\Database\Seeder;

class TaxSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $taxes = [
            ['code' => 'PPN', 'name' => 'Pajak Pertambahan Nilai (PPN)', 'rate' => 11.00],
            ['code' => 'PPN0', 'name' => 'PPN Ekspor (Zero-Rated Export)', 'rate' => 0.00],
            ['code' => 'PPH22', 'name' => 'PPh Pasal 22 (Purchase of Goods)', 'rate' => 1.50],
            ['code' => 'PPH23', 'name' => 'PPh Pasal 23 (Services Withholding)', 'rate' => 2.00],
            ['code' => 'PPH4A2', 'name' => 'PPh Final Pasal 4(2) (Construction Services)', 'rate' => 2.65],
        ];

        foreach ($taxes as $tax) {
            Tax::factory()->create([
                'code' => $tax['code'],
                'name' => $tax['name'],
                'rate' => $tax['rate'],
                'type' => 'percentage',
            ]);
        }
    }
}
