<?php

namespace Database\Factories;

use App\Models\DeliveryOrder;
use App\Models\Quotation;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<DeliveryOrder>
 */
class DeliveryOrderFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'quotation_id' => Quotation::factory(),
            'delivery_date' => fake()->dateTimeBetween('-1 month', 'now'),
            'status' => 'draft',
        ];
    }
}
