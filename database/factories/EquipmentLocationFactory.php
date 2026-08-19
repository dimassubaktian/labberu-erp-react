<?php

namespace Database\Factories;

use App\Models\EquipmentLocation;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<EquipmentLocation>
 */
class EquipmentLocationFactory extends Factory
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
            'code' => fake()->unique()->bothify('LOC-###'),
            'description' => fake()->optional()->sentence(),
            'is_active' => true,
        ];
    }
}
