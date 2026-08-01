<?php

namespace Database\Factories;

use App\Models\Currency;
use App\Models\Customer;
use App\Models\Project;
use App\Models\PurchaseOrder;
use App\Models\Quotation;
use App\Models\Vendor;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<PurchaseOrder>
 */
class PurchaseOrderFactory extends Factory
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
            'quotation_id' => Quotation::factory(),
            'customer_id' => Customer::factory(),
            'vendor_id' => Vendor::factory(),
            'project_name' => fake()->sentence(3),
            'date' => fake()->dateTimeBetween('-1 month', 'now'),
            'currency_id' => Currency::factory(),
            'status' => 'draft',
            'subtotal' => 0,
            'discount_total' => 0,
            'net_after_discount' => 0,
            'tax_amount' => 0,
            'grand_total' => 0,
        ];
    }
}
