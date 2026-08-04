<?php

namespace Database\Seeders;

use App\Models\Product;
use Illuminate\Database\Seeder;

class ProductSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        foreach ($this->products() as $product) {
            Product::factory()->create($product);
        }
    }

    /**
     * @return array<int, array<string, mixed>>
     */
    private function products(): array
    {
        return [
            // Electrical distribution panel components
            ['name' => 'MCCB 3P 100A', 'reference_number' => 'REF-EL-001', 'descriptions' => 'Moulded Case Circuit Breaker, 3 Pole, 100A rating, thermal-magnetic trip.', 'brand' => 'Schneider Electric', 'unit' => 'Pcs', 'type' => 'goods', 'price' => 650_000, 'cost' => 450_000],
            ['name' => 'MCCB 3P 250A', 'reference_number' => 'REF-EL-002', 'descriptions' => 'Moulded Case Circuit Breaker, 3 Pole, 250A rating, adjustable thermal-magnetic trip.', 'brand' => 'ABB', 'unit' => 'Pcs', 'type' => 'goods', 'price' => 4_500_000, 'cost' => 3_200_000],
            ['name' => 'MCB 1P 16A', 'reference_number' => 'REF-EL-003', 'descriptions' => 'Miniature Circuit Breaker, 1 Pole, 16A, C-curve.', 'brand' => 'Schneider Electric', 'unit' => 'Pcs', 'type' => 'goods', 'price' => 75_000, 'cost' => 45_000],
            ['name' => 'MCB 3P 32A', 'reference_number' => 'REF-EL-004', 'descriptions' => 'Miniature Circuit Breaker, 3 Pole, 32A, C-curve.', 'brand' => 'Legrand', 'unit' => 'Pcs', 'type' => 'goods', 'price' => 95_000, 'cost' => 65_000],
            ['name' => 'ACB 3P 1600A', 'reference_number' => 'REF-EL-005', 'descriptions' => 'Air Circuit Breaker, 3 Pole, 1600A, withdrawable, motorized.', 'brand' => 'Siemens', 'unit' => 'Unit', 'type' => 'goods', 'price' => 62_000_000, 'cost' => 45_000_000],
            ['name' => 'Magnetic Contactor 32A', 'reference_number' => 'REF-EL-006', 'descriptions' => 'AC magnetic contactor, 32A, 3 pole, 220V coil.', 'brand' => 'Mitsubishi Electric', 'unit' => 'Pcs', 'type' => 'goods', 'price' => 500_000, 'cost' => 350_000],
            ['name' => 'Magnetic Contactor 65A', 'reference_number' => 'REF-EL-007', 'descriptions' => 'AC magnetic contactor, 65A, 3 pole, 220V coil.', 'brand' => 'LS Electric', 'unit' => 'Pcs', 'type' => 'goods', 'price' => 1_050_000, 'cost' => 750_000],
            ['name' => 'Thermal Overload Relay 18-25A', 'reference_number' => 'REF-EL-008', 'descriptions' => 'Thermal overload relay, adjustable 18-25A range.', 'brand' => 'Schneider Electric', 'unit' => 'Pcs', 'type' => 'goods', 'price' => 420_000, 'cost' => 280_000],
            ['name' => 'Copper Busbar 40x5mm', 'reference_number' => 'REF-EL-009', 'descriptions' => 'Tin-plated copper busbar, 40x5mm cross-section, sold per meter.', 'brand' => 'Chint', 'unit' => 'Meter', 'type' => 'goods', 'price' => 250_000, 'cost' => 180_000],
            ['name' => 'Panel Enclosure 800x600x300mm', 'reference_number' => 'REF-EL-010', 'descriptions' => 'Free-standing steel panel enclosure, IP54, powder-coated.', 'brand' => 'Hager', 'unit' => 'Unit', 'type' => 'goods', 'price' => 3_900_000, 'cost' => 2_800_000],
            ['name' => 'Terminal Block 4mm² (Box of 100)', 'reference_number' => 'REF-EL-011', 'descriptions' => 'DIN rail terminal block, 4mm², box of 100 pieces.', 'brand' => 'Legrand', 'unit' => 'Box', 'type' => 'goods', 'price' => 500_000, 'cost' => 350_000],
            ['name' => 'Cable Gland PG16 (Pack of 50)', 'reference_number' => 'REF-EL-012', 'descriptions' => 'Nylon cable gland PG16, pack of 50 pieces.', 'brand' => 'Chint', 'unit' => 'Pack', 'type' => 'goods', 'price' => 375_000, 'cost' => 250_000],
            ['name' => 'LED Indicator Lamp 22mm Red', 'reference_number' => 'REF-EL-013', 'descriptions' => '22mm panel-mount LED pilot lamp, red, 220V.', 'brand' => 'Schneider Electric', 'unit' => 'Pcs', 'type' => 'goods', 'price' => 45_000, 'cost' => 25_000],
            ['name' => 'Emergency Push Button 22mm', 'reference_number' => 'REF-EL-014', 'descriptions' => '22mm mushroom-head emergency stop push button, twist-release.', 'brand' => 'Fuji Electric', 'unit' => 'Pcs', 'type' => 'goods', 'price' => 95_000, 'cost' => 65_000],
            ['name' => 'Digital Ammeter Panel Meter', 'reference_number' => 'REF-EL-015', 'descriptions' => 'Digital panel-mount ammeter, 96x96mm, CT input.', 'brand' => 'Omron', 'unit' => 'Pcs', 'type' => 'goods', 'price' => 550_000, 'cost' => 350_000],
            ['name' => 'Digital Power Meter 3-Phase', 'reference_number' => 'REF-EL-016', 'descriptions' => 'Three-phase digital power meter, kWh/kW/PF measurement, Modbus output.', 'brand' => 'Schneider Electric', 'unit' => 'Pcs', 'type' => 'goods', 'price' => 1_800_000, 'cost' => 1_200_000],
            ['name' => 'Current Transformer (CT) 100/5A', 'reference_number' => 'REF-EL-017', 'descriptions' => 'Split-core current transformer, 100/5A ratio.', 'brand' => 'LS Electric', 'unit' => 'Pcs', 'type' => 'goods', 'price' => 280_000, 'cost' => 180_000],
            ['name' => 'PLC Module (Compact, 24 I/O)', 'reference_number' => 'REF-EL-018', 'descriptions' => 'Compact PLC module, 24 digital I/O, panel-integrated automation.', 'brand' => 'Mitsubishi Electric', 'unit' => 'Unit', 'type' => 'goods', 'price' => 5_200_000, 'cost' => 3_500_000],

            // Solar power plant equipment
            ['name' => 'Solar PV Module 550Wp Mono PERC', 'reference_number' => 'REF-SP-001', 'descriptions' => 'Monocrystalline PERC solar panel, 550Wp, 144 half-cut cells.', 'brand' => 'Other', 'unit' => 'Pcs', 'type' => 'goods', 'price' => 2_400_000, 'cost' => 1_800_000],
            ['name' => 'Solar PV Module 450Wp Mono PERC', 'reference_number' => 'REF-SP-002', 'descriptions' => 'Monocrystalline PERC solar panel, 450Wp, 120 half-cut cells.', 'brand' => 'Other', 'unit' => 'Pcs', 'type' => 'goods', 'price' => 2_000_000, 'cost' => 1_500_000],
            ['name' => 'Solar String Inverter 50kW Three-Phase', 'reference_number' => 'REF-SP-003', 'descriptions' => 'Grid-tie string inverter, 50kW output, three-phase, IP65.', 'brand' => 'Other', 'unit' => 'Unit', 'type' => 'goods', 'price' => 62_000_000, 'cost' => 45_000_000],
            ['name' => 'Solar String Inverter 10kW Single-Phase', 'reference_number' => 'REF-SP-004', 'descriptions' => 'Grid-tie string inverter, 10kW output, single-phase, IP65.', 'brand' => 'Other', 'unit' => 'Unit', 'type' => 'goods', 'price' => 16_500_000, 'cost' => 12_000_000],
            ['name' => 'Solar Ground Mounting Structure (per kWp)', 'reference_number' => 'REF-SP-005', 'descriptions' => 'Galvanized steel ground-mount structure set, sized per kWp installed.', 'brand' => 'Other', 'unit' => 'Set', 'type' => 'goods', 'price' => 1_200_000, 'cost' => 850_000],
            ['name' => 'Solar Rooftop Mounting Rail System', 'reference_number' => 'REF-SP-006', 'descriptions' => 'Aluminum rooftop rail mounting system set, includes clamps and hooks.', 'brand' => 'Other', 'unit' => 'Set', 'type' => 'goods', 'price' => 950_000, 'cost' => 650_000],
            ['name' => 'DC Combiner Box 4-String', 'reference_number' => 'REF-SP-007', 'descriptions' => 'DC combiner box with 4 string inputs, fuses, and surge protection.', 'brand' => 'Other', 'unit' => 'Unit', 'type' => 'goods', 'price' => 2_200_000, 'cost' => 1_500_000],
            ['name' => 'AC Combiner Box 3-Phase', 'reference_number' => 'REF-SP-008', 'descriptions' => 'AC combiner box for three-phase inverter output, with breakers and SPD.', 'brand' => 'Other', 'unit' => 'Unit', 'type' => 'goods', 'price' => 2_600_000, 'cost' => 1_800_000],
            ['name' => 'Solar DC Cable 4mm² (Roll 100m)', 'reference_number' => 'REF-SP-009', 'descriptions' => 'UV-resistant single-core DC solar cable, 4mm², roll of 100 meters.', 'brand' => 'Other', 'unit' => 'Roll', 'type' => 'goods', 'price' => 1_650_000, 'cost' => 1_200_000],
            ['name' => 'MC4 Connector Pair', 'reference_number' => 'REF-SP-010', 'descriptions' => 'MC4 male/female connector pair for solar module interconnection.', 'brand' => 'Other', 'unit' => 'Pack', 'type' => 'goods', 'price' => 45_000, 'cost' => 25_000],
            ['name' => 'Solar Charge Controller MPPT 60A', 'reference_number' => 'REF-SP-011', 'descriptions' => 'MPPT solar charge controller, 60A, for hybrid/off-grid systems.', 'brand' => 'Other', 'unit' => 'Pcs', 'type' => 'goods', 'price' => 3_100_000, 'cost' => 2_200_000],
            ['name' => 'Deep Cycle Battery 200Ah 12V', 'reference_number' => 'REF-SP-012', 'descriptions' => 'Deep cycle AGM battery, 200Ah, 12V, for solar energy storage.', 'brand' => 'Other', 'unit' => 'Pcs', 'type' => 'goods', 'price' => 4_800_000, 'cost' => 3_500_000],

            // Cables & wires
            ['name' => 'NYY Cable 4x16mm² (Roll 100m)', 'reference_number' => 'REF-CB-001', 'descriptions' => 'NYY armored power cable, 4 core x 16mm², roll of 100 meters.', 'brand' => 'Chint', 'unit' => 'Roll', 'type' => 'goods', 'price' => 3_300_000, 'cost' => 2_500_000],
            ['name' => 'NYAF Cable 1x6mm² (Roll 100m)', 'reference_number' => 'REF-CB-002', 'descriptions' => 'NYAF flexible single-core cable, 6mm², roll of 100 meters.', 'brand' => 'Other', 'unit' => 'Roll', 'type' => 'goods', 'price' => 900_000, 'cost' => 650_000],
            ['name' => 'NYM Cable 3x2.5mm² (Roll 50m)', 'reference_number' => 'REF-CB-003', 'descriptions' => 'NYM sheathed installation cable, 3 core x 2.5mm², roll of 50 meters.', 'brand' => 'Other', 'unit' => 'Roll', 'type' => 'goods', 'price' => 650_000, 'cost' => 450_000],
            ['name' => 'Armored Cable NYFGbY 4x25mm²', 'reference_number' => 'REF-CB-004', 'descriptions' => 'Steel-wire-armored underground cable, 4 core x 25mm², sold per meter.', 'brand' => 'Other', 'unit' => 'Meter', 'type' => 'goods', 'price' => 120_000, 'cost' => 85_000],
            ['name' => 'Flexible Cable NYYHY 2x1.5mm² (Roll 100m)', 'reference_number' => 'REF-CB-005', 'descriptions' => 'Flexible sheathed cable, 2 core x 1.5mm², roll of 100 meters.', 'brand' => 'Other', 'unit' => 'Roll', 'type' => 'goods', 'price' => 780_000, 'cost' => 550_000],

            // Services
            ['name' => 'Panel Assembly Service', 'reference_number' => 'REF-SV-001', 'descriptions' => 'Fabrication and assembly of a custom electrical distribution panel per drawing.', 'brand' => 'Other', 'unit' => 'Set', 'type' => 'service', 'price' => 2_500_000, 'cost' => 1_500_000],
            ['name' => 'Solar Installation Service', 'reference_number' => 'REF-SV-002', 'descriptions' => 'On-site installation of solar PV modules, mounting, and cabling per kWp.', 'brand' => 'Other', 'unit' => 'Set', 'type' => 'service', 'price' => 3_500_000, 'cost' => 2_000_000],
            ['name' => 'Electrical Design & Engineering Service', 'reference_number' => 'REF-SV-003', 'descriptions' => 'Single-line diagram design, load calculation, and engineering drawing package.', 'brand' => 'Other', 'unit' => 'Unit', 'type' => 'service', 'price' => 5_000_000, 'cost' => 3_000_000],
            ['name' => 'Commissioning & Testing Service', 'reference_number' => 'REF-SV-004', 'descriptions' => 'Functional testing, commissioning, and handover documentation for panels or solar systems.', 'brand' => 'Other', 'unit' => 'Unit', 'type' => 'service', 'price' => 2_500_000, 'cost' => 1_500_000],
            ['name' => 'Preventive Maintenance Service', 'reference_number' => 'REF-SV-005', 'descriptions' => 'Scheduled inspection and preventive maintenance for panels or solar installations.', 'brand' => 'Other', 'unit' => 'Unit', 'type' => 'service', 'price' => 1_500_000, 'cost' => 800_000],
        ];
    }
}
