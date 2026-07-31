<?php

namespace Database\Factories;

use App\Models\Tax;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Tax>
 */
class TaxFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'name' => ucwords(fake()->word()).' Tax',
            'code' => fake()->unique()->regexify('[A-Z]{3}[0-9]{2}'),
            'rate' => fake()->randomFloat(2, 0, 100),
            'type' => fake()->randomElement(['percentage', 'fixed']),
        ];
    }

    /**
     * Indicate that the tax is a percentage-based rate.
     */
    public function percentage(): static
    {
        return $this->state(fn (array $attributes) => [
            'type' => 'percentage',
        ]);
    }

    /**
     * Indicate that the tax is a fixed-amount rate.
     */
    public function fixed(): static
    {
        return $this->state(fn (array $attributes) => [
            'type' => 'fixed',
        ]);
    }
}
