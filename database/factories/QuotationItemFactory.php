<?php

namespace Database\Factories;

use App\Models\Product;
use App\Models\Quotation;
use App\Models\QuotationItem;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<QuotationItem>
 */
class QuotationItemFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        $quantity = fake()->numberBetween(1, 20);
        $unitPrice = fake()->randomFloat(2, 10_000, 500_000);
        $unitCost = fake()->randomFloat(2, 5_000, (float) $unitPrice);
        $totalPrice = $quantity * $unitPrice;
        $totalCost = $quantity * $unitCost;
        $margin = $totalPrice - $totalCost;

        return [
            'quotation_id' => Quotation::factory(),
            'product_id' => Product::factory(),
            'quantity' => $quantity,
            'unit' => 'Pcs',
            'unit_price' => $unitPrice,
            'unit_cost' => $unitCost,
            'total_price' => $totalPrice,
            'total_cost' => $totalCost,
            'margin' => $margin,
            'margin_percent' => $totalPrice > 0 ? round($margin / $totalPrice * 100, 2) : 0,
        ];
    }
}
