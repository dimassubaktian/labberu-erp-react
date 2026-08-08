<?php

namespace Database\Factories;

use App\Models\PaymentTermTemplate;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<PaymentTermTemplate>
 */
class PaymentTermTemplateFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'name' => ucwords(fake()->words(3, true)).' Terms',
            'content' => '<p>'.fake()->paragraph().'</p>',
        ];
    }
}
