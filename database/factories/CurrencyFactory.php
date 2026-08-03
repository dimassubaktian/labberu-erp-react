<?php

namespace Database\Factories;

use App\Models\Currency;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Currency>
 */
class CurrencyFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'iso_code' => fake()->unique()->currencyCode(),
            'name' => ucwords(fake()->word().' '.fake()->word()).' Currency',
            'symbol' => fake()->randomElement(['$', 'Rp', '€', '£', null]),
            'status' => 'active',
            'base_currency' => false,
        ];
    }

    /**
     * Indicate that the currency is inactive.
     */
    public function inactive(): static
    {
        return $this->state(fn (array $attributes) => [
            'status' => 'inactive',
        ]);
    }

    /**
     * Indicate that the currency is the base currency.
     */
    public function baseCurrency(): static
    {
        return $this->state(fn (array $attributes) => [
            'base_currency' => true,
        ]);
    }
}
