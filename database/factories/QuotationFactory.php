<?php

namespace Database\Factories;

use App\Models\Currency;
use App\Models\Project;
use App\Models\Quotation;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Quotation>
 */
class QuotationFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'project_id' => Project::factory(),
            'status' => 'draft',
            'currency_id' => Currency::factory(),
            'valid_until' => fake()->dateTimeBetween('now', '+30 days'),
            'subtotal' => 0,
            'discount_amount' => 0,
            'tax_amount' => 0,
            'total' => 0,
            'remarks' => fake()->sentence(),
        ];
    }
}
