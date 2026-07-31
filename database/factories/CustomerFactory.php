<?php

namespace Database\Factories;

use App\Models\Customer;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Customer>
 */
class CustomerFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'name' => fake()->company(),
            'attention' => fake()->name(),
            'phone' => fake()->phoneNumber(),
            'fax' => fake()->phoneNumber(),
            'address' => fake()->streetAddress(),
            'city' => fake()->city(),
            'province' => fake()->randomElement(['DKI Jakarta', 'West Java', 'East Java', 'Bali']),
            'country' => fake()->country(),
            'postal_code' => fake()->postcode(),
            'remarks' => fake()->sentence(),
        ];
    }
}
