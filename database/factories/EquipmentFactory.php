<?php

namespace Database\Factories;

use App\Models\Equipment;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Equipment>
 */
class EquipmentFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'name' => fake()->words(3, true),
            'category' => fake()->randomElement(['Multimeter', 'Caliper', 'Torque Wrench', 'Pressure Gauge']),
            'model_type' => fake()->bothify('Model-###'),
            'serial_number' => fake()->unique()->bothify('SN-########'),
            'brand' => fake()->company(),
            'calibration_required' => true,
            'calibration_interval_months' => 12,
            'status' => 'available',
        ];
    }

    /**
     * Indicate that the equipment does not require calibration.
     */
    public function notCalibrated(): static
    {
        return $this->state(fn (array $attributes) => [
            'calibration_required' => false,
            'calibration_interval_months' => null,
        ]);
    }
}
