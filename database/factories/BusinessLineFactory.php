<?php

namespace Database\Factories;

use App\Models\BusinessLine;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<BusinessLine>
 */
class BusinessLineFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'name' => fake()->unique()->words(2, true),
            'description' => fake()->optional()->sentence(),
            'status' => 'active',
        ];
    }

    /**
     * Indicate that the business line is inactive.
     */
    public function inactive(): static
    {
        return $this->state(fn (array $attributes) => [
            'status' => 'inactive',
        ]);
    }
}
