<?php

namespace Database\Factories;

use App\Models\Product;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Product>
 */
class ProductFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'name' => ucwords(fake()->word().' '.fake()->word()),
            'reference_number' => fake()->unique()->numerify('REF-########'),
            'descriptions' => fake()->sentence(),
            'brand' => fake()->company(),
            'unit' => fake()->randomElement(['pcs', 'box', 'kg', 'liter']),
            'type' => fake()->randomElement(['goods', 'service']),
            'price' => fake()->randomFloat(2, 10_000, 500_000),
            'cost' => fake()->randomFloat(2, 5_000, 300_000),
            'status' => 'active',
        ];
    }

    /**
     * Indicate that the product is inactive.
     */
    public function inactive(): static
    {
        return $this->state(fn (array $attributes) => [
            'status' => 'inactive',
        ]);
    }
}
