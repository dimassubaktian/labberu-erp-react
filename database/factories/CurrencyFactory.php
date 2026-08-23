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
    /**
     * Running sequence used to hand out collision-free iso codes. Real currency codes (USD, EUR,
     * IDR, …) that tests hard-code sit far up the AAA→ZZZ range, so factory-made currencies never
     * clash with an explicitly-created one on the active-iso_code unique index.
     */
    private static int $sequence = 0;

    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'iso_code' => self::nextIsoCode(),
            'name' => ucwords(fake()->word().' '.fake()->word()).' Currency',
            'symbol' => fake()->randomElement(['$', 'Rp', '€', '£', null]),
            'status' => 'active',
            'base_currency' => false,
        ];
    }

    /**
     * A three-letter code walked deterministically from AAA upward, so every factory currency is
     * unique within the process without drawing from Faker's small real-code pool.
     */
    private static function nextIsoCode(): string
    {
        $n = self::$sequence++;

        return chr(65 + intdiv($n, 676) % 26)
            .chr(65 + intdiv($n, 26) % 26)
            .chr(65 + $n % 26);
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
