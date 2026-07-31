<?php

namespace Database\Factories;

use App\Models\JobTitle;
use App\Models\Workforce;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Workforce>
 */
class WorkforceFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'full_name' => fake()->name(),
            'email' => fake()->unique()->safeEmail(),
            'phone' => fake()->phoneNumber(),
            'address' => fake()->address(),
            'job_title_id' => JobTitle::factory(),
            'gender' => fake()->randomElement(['male', 'female']),
            'photo' => null,
            'status' => 'active',
        ];
    }

    /**
     * Indicate that the workforce member is inactive.
     */
    public function inactive(): static
    {
        return $this->state(fn (array $attributes) => [
            'status' => 'inactive',
        ]);
    }
}
