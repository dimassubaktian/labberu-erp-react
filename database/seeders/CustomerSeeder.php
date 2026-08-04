<?php

namespace Database\Seeders;

use App\Models\Customer;
use Illuminate\Database\Seeder;

class CustomerSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $customers = [
            ['name' => 'Kawasan Industri Jababeka Tbk PT', 'attention' => 'Wawan Setiadi', 'phone' => '021-8934-5678', 'fax' => '021-8934-5679', 'address' => 'Jl. Jababeka Raya Blok F', 'city' => 'Cikarang', 'province' => 'Jawa Barat', 'postal_code' => '17530', 'remarks' => 'Industrial estate developer, ongoing panel supply for tenant substations.'],
            ['name' => 'Astra Otoparts Tbk PT', 'attention' => 'Rina Marlina', 'phone' => '021-6519-555', 'fax' => '021-6519-556', 'address' => 'Jl. Raya Pegangsaan Dua Km. 2.2', 'city' => 'Jakarta Utara', 'province' => 'DKI Jakarta', 'postal_code' => '14250', 'remarks' => 'Automotive component manufacturer, distribution panel upgrade project.'],
            ['name' => 'Nestlé Indonesia PT', 'attention' => 'Yoga Pratama', 'phone' => '0267-864-1000', 'fax' => '0267-864-1001', 'address' => 'Jl. Raya Karawang-Bekasi Km. 29', 'city' => 'Karawang', 'province' => 'Jawa Barat', 'postal_code' => '41371', 'remarks' => 'Food manufacturing plant, factory electrical panel maintenance contract.'],
            ['name' => 'Pertamina Power Indonesia PT', 'attention' => 'Dian Anggraini', 'phone' => '021-2900-1234', 'fax' => '021-2900-1235', 'address' => 'Jl. Medan Merdeka Timur No. 1A', 'city' => 'Jakarta Pusat', 'province' => 'DKI Jakarta', 'postal_code' => '10110', 'remarks' => 'Solar power plant EPC customer, multi-site rooftop solar rollout.'],
            ['name' => 'Indofood Sukses Makmur Tbk PT', 'attention' => 'Eko Prasetyo', 'phone' => '021-5795-8822', 'fax' => '021-5795-8823', 'address' => 'Jl. Raya Serang Km. 12', 'city' => 'Tangerang', 'province' => 'Banten', 'postal_code' => '15710', 'remarks' => 'Food manufacturing plant, MDP/SDP panel replacement project.'],
            ['name' => 'Sinar Mas Land PT', 'attention' => 'Lina Kartika', 'phone' => '021-2988-8888', 'fax' => '021-2988-8889', 'address' => 'BSD Green Office Park, Jl. BSD Boulevard', 'city' => 'Jakarta Selatan', 'province' => 'DKI Jakarta', 'postal_code' => '12190', 'remarks' => 'Property developer, electrical works for new commercial towers.'],
            ['name' => 'Angkasa Pura I PT', 'attention' => 'Bayu Firmansyah', 'phone' => '031-286-8000', 'fax' => '031-286-8001', 'address' => 'Jl. Ir. H. Juanda, Bandara Internasional', 'city' => 'Surabaya', 'province' => 'Jawa Timur', 'postal_code' => '61253', 'remarks' => 'Airport operator, terminal distribution panel and rooftop solar project.'],
            ['name' => 'RS Siloam Hospitals', 'attention' => 'Maya Puspita', 'phone' => '021-2966-0900', 'fax' => '021-2966-0901', 'address' => 'Jl. Siloam No. 6, Lippo Karawaci', 'city' => 'Tangerang', 'province' => 'Banten', 'postal_code' => '15811', 'remarks' => 'Hospital group, critical power distribution panel with backup ATS.'],
            ['name' => 'Grand Indonesia PT', 'attention' => 'Fitri Handayani', 'phone' => '021-2358-7000', 'fax' => '021-2358-7001', 'address' => 'Jl. MH Thamrin No. 1', 'city' => 'Jakarta Pusat', 'province' => 'DKI Jakarta', 'postal_code' => '10310', 'remarks' => 'Shopping mall and hotel complex, annual panel maintenance contract.'],
        ];

        foreach ($customers as $customer) {
            Customer::factory()->create([
                ...$customer,
                'country' => 'Indonesia',
            ]);
        }
    }
}
