<?php

namespace Database\Factories;

use App\Models\CompanySetting;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<CompanySetting>
 */
class CompanySettingFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'legal_name' => fake()->company(),
            'trade_name' => fake()->companySuffix(),
            'tax_id' => fake()->numerify('##.###.###.#-###.###'),
            'business_registration_number' => fake()->numerify('#########'),
            'email' => fake()->companyEmail(),
            'phone' => fake()->phoneNumber(),
            'website' => fake()->url(),
            'address' => fake()->streetAddress(),
            'city' => fake()->city(),
            'province' => fake()->randomElement(['DKI Jakarta', 'West Java', 'East Java', 'Bali']),
            'postal_code' => fake()->postcode(),
            'country' => fake()->country(),
            'logo' => null,
        ];
    }
}
