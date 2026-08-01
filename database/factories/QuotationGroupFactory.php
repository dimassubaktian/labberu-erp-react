<?php

namespace Database\Factories;

use App\Models\Quotation;
use App\Models\QuotationGroup;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<QuotationGroup>
 */
class QuotationGroupFactory extends Factory
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
            'name' => fake()->randomElement(['Labor', 'Materials', 'Equipment']),
            'sort_order' => 0,
            'subtotal' => 0,
            'discount_amount' => 0,
            'tax_amount' => 0,
            'total' => 0,
        ];
    }
}
