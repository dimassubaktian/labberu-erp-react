<?php

namespace Database\Seeders;

use App\Models\Vendor;
use Illuminate\Database\Seeder;

class VendorSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $vendors = [
            ['name' => 'Schneider Electric Indonesia PT', 'attention' => 'Budi Santoso', 'phone' => '021-2953-0500', 'fax' => '021-2953-0501', 'address' => 'Jl. TB Simatupang Kav. 1', 'city' => 'Jakarta Selatan', 'province' => 'DKI Jakarta', 'postal_code' => '12560', 'remarks' => 'Authorized distributor for MCCB, MCB, and ACB product lines.'],
            ['name' => 'ABB Sakti Industri PT', 'attention' => 'Andi Wijaya', 'phone' => '021-4482-6666', 'fax' => '021-4482-6667', 'address' => 'Jl. Yos Sudarso, Cilincing', 'city' => 'Jakarta Utara', 'province' => 'DKI Jakarta', 'postal_code' => '14140', 'remarks' => 'Supplier of low and medium voltage switchgear.'],
            ['name' => 'Supreme Cable Manufacturing & Commerce Tbk PT', 'attention' => 'Hendra Kusuma', 'phone' => '021-619-0108', 'fax' => '021-619-0109', 'address' => 'Jl. Daan Mogot Km. 16', 'city' => 'Jakarta Barat', 'province' => 'DKI Jakarta', 'postal_code' => '11840', 'remarks' => 'Local manufacturer of NYY/NYM/NYAF power cables.'],
            ['name' => 'Kabelindo Murni Tbk PT', 'attention' => 'Rudi Hartono', 'phone' => '021-4600-784', 'fax' => '021-4600-785', 'address' => 'Jl. Rawa Girang No. 2, Kawasan Industri Pulogadung', 'city' => 'Jakarta Timur', 'province' => 'DKI Jakarta', 'postal_code' => '13930', 'remarks' => 'Cable and wire manufacturer, competitive on bulk roll orders.'],
            ['name' => 'Surya Energi Indotama PT', 'attention' => 'Dewi Lestari', 'phone' => '021-5296-0123', 'fax' => '021-5296-0124', 'address' => 'Jl. Gatot Subroto Kav. 18', 'city' => 'Jakarta Selatan', 'province' => 'DKI Jakarta', 'postal_code' => '12930', 'remarks' => 'Importer/distributor of solar PV modules and inverters.'],
            ['name' => 'Panel Baja Sejahtera PT', 'attention' => 'Agus Setiawan', 'phone' => '021-5900-321', 'fax' => '021-5900-322', 'address' => 'Jl. Industri Raya III, Kawasan Industri Jatake', 'city' => 'Tangerang', 'province' => 'Banten', 'postal_code' => '15135', 'remarks' => 'Custom fabrication of panel enclosures and steel housings.'],
            ['name' => 'Sinar Logam Perkasa PT', 'attention' => 'Bambang Prasetyo', 'phone' => '021-8250-456', 'fax' => '021-8250-457', 'address' => 'Jl. Raya Narogong Km. 12', 'city' => 'Bekasi', 'province' => 'Jawa Barat', 'postal_code' => '17310', 'remarks' => 'Sheet metal and steel fabrication for busbars and brackets.'],
            ['name' => 'Multi Trafo Sarana PT', 'attention' => 'Sri Wahyuni', 'phone' => '031-841-2233', 'fax' => '031-841-2234', 'address' => 'Jl. Rungkut Industri I', 'city' => 'Surabaya', 'province' => 'Jawa Timur', 'postal_code' => '60293', 'remarks' => 'Transformer and switchgear supplier for East Java projects.'],
            ['name' => 'Solartech Nusantara PT', 'attention' => 'Fajar Nugroho', 'phone' => '022-756-8899', 'fax' => '022-756-8900', 'address' => 'Jl. Soekarno Hatta No. 45', 'city' => 'Bandung', 'province' => 'Jawa Barat', 'postal_code' => '40234', 'remarks' => 'Solar mounting structures and balance-of-system components.'],
        ];

        foreach ($vendors as $vendor) {
            Vendor::factory()->create([
                ...$vendor,
                'country' => 'Indonesia',
            ]);
        }
    }
}
