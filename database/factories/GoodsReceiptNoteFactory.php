<?php

namespace Database\Factories;

use App\Models\GoodsReceiptNote;
use App\Models\PurchaseOrder;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<GoodsReceiptNote>
 */
class GoodsReceiptNoteFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'purchase_order_id' => PurchaseOrder::factory(),
            'received_date' => fake()->dateTimeBetween('-1 month', 'now'),
            'status' => 'draft',
        ];
    }
}
