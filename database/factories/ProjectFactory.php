<?php

namespace Database\Factories;

use App\Models\Customer;
use App\Models\Project;
use App\Models\Workforce;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Project>
 */
class ProjectFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'name' => ucwords(fake()->word().' '.fake()->word()).' Project',
            'customer_id' => Customer::factory(),
            'request_date' => fake()->dateTimeBetween('-3 months', 'now'),
            'person_in_charge_id' => Workforce::factory(),
            'description' => fake()->sentence(),
            'status' => 'new',
            'priority' => fake()->randomElement(['low', 'medium', 'high', 'urgent']),
            'start_date' => null,
            'end_date' => null,
            'completed_at' => null,
            'estimate_contract_value' => fake()->randomFloat(2, 1_000_000, 500_000_000),
            'estimate_cost' => fake()->randomFloat(2, 1_000_000, 400_000_000),
            'actual_cost' => null,
            'actual_contract_value' => null,
        ];
    }
}
