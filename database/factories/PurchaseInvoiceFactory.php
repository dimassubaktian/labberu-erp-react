<?php

namespace Database\Factories;

use App\Models\PurchaseInvoice;
use App\Models\PurchaseOrder;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<PurchaseInvoice>
 */
class PurchaseInvoiceFactory extends Factory
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
            'invoice_date' => fake()->dateTimeBetween('-1 month', 'now'),
            'due_date' => fake()->dateTimeBetween('now', '+30 days'),
            'status' => 'draft',
            'subtotal' => 0,
            'discount_amount' => 0,
            'tax_amount' => 0,
            'total' => 0,
        ];
    }
}
