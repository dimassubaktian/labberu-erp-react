<?php

namespace Database\Seeders;

use App\Models\Currency;
use Illuminate\Database\Seeder;

class CurrencySeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $currencies = [
            ['iso_code' => 'IDR', 'name' => 'Indonesian Rupiah', 'symbol' => 'Rp', 'base_currency' => true],
            ['iso_code' => 'USD', 'name' => 'United States Dollar', 'symbol' => '$', 'base_currency' => false],
            ['iso_code' => 'SGD', 'name' => 'Singapore Dollar', 'symbol' => 'S$', 'base_currency' => false],
            ['iso_code' => 'MYR', 'name' => 'Malaysian Ringgit', 'symbol' => 'RM', 'base_currency' => false],
            ['iso_code' => 'THB', 'name' => 'Thai Baht', 'symbol' => '฿', 'base_currency' => false],
            ['iso_code' => 'PHP', 'name' => 'Philippine Peso', 'symbol' => '₱', 'base_currency' => false],
            ['iso_code' => 'VND', 'name' => 'Vietnamese Dong', 'symbol' => '₫', 'base_currency' => false],
            ['iso_code' => 'BND', 'name' => 'Brunei Dollar', 'symbol' => 'B$', 'base_currency' => false],
            ['iso_code' => 'MMK', 'name' => 'Myanmar Kyat', 'symbol' => 'K', 'base_currency' => false],
            ['iso_code' => 'KHR', 'name' => 'Cambodian Riel', 'symbol' => '៛', 'base_currency' => false],
            ['iso_code' => 'LAK', 'name' => 'Lao Kip', 'symbol' => '₭', 'base_currency' => false],
        ];

        foreach ($currencies as $currency) {
            Currency::factory()->create([
                'iso_code' => $currency['iso_code'],
                'name' => $currency['name'],
                'symbol' => $currency['symbol'],
                'status' => 'active',
                'base_currency' => $currency['base_currency'],
            ]);
        }
    }
}
