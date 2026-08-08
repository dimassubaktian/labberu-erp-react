<?php

use App\Models\Currency;
use App\Models\PaymentTermTemplate;
use App\Models\Product;
use App\Models\Quotation;
use App\Models\QuotationItem;
use App\Models\Tax;
use App\Models\User;
use Inertia\Testing\AssertableInertia as Assert;

test('draft quotation edit page is displayed', function () {
    $user = User::factory()->create();
    $quotation = Quotation::factory()->create();
    QuotationItem::factory()->create(['quotation_id' => $quotation->id]);

    $this->actingAs($user)
        ->get(route('quotations.edit', $quotation))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('quotations/edit')
            ->where('quotation.uuid', $quotation->uuid),
        );
});

test('non-draft quotation cannot be edited', function () {
    $user = User::factory()->create();
    $quotation = Quotation::factory()->create(['status' => 'approved']);

    $this->actingAs($user)
        ->get(route('quotations.edit', $quotation))
        ->assertForbidden();

    $this->actingAs($user)
        ->put(route('quotations.update', $quotation), [])
        ->assertForbidden();
});

test('quotation can be updated with totals recalculated', function () {
    $user = User::factory()->create();
    $quotation = Quotation::factory()->create();
    QuotationItem::factory()->create(['quotation_id' => $quotation->id]);
    $currency = Currency::factory()->create();
    $product = Product::factory()->create(['price' => 100_000, 'cost' => 60_000]);

    $response = $this->actingAs($user)
        ->put(route('quotations.update', $quotation), [
            'currency_id' => $currency->id,
            'items' => [
                [
                    'product_id' => $product->id,
                    'quantity' => 3,
                    'unit' => 'Pcs',
                    'unit_price' => 100_000,
                    'unit_cost' => 60_000,
                ],
            ],
        ]);

    $response->assertSessionHasNoErrors();
    $response->assertRedirect(route('quotations.show', $quotation));

    $quotation->refresh();

    expect((float) $quotation->subtotal)->toBe(300_000.0);
    expect((float) $quotation->total)->toBe(300_000.0);
    expect($quotation->currency_id)->toBe($currency->id);
    expect($quotation->items()->count())->toBe(1);
});

test('quotation-level discount and tax are recalculated on update', function () {
    $user = User::factory()->create();
    $quotation = Quotation::factory()->create();
    QuotationItem::factory()->create(['quotation_id' => $quotation->id]);
    $currency = Currency::factory()->create();
    $tax = Tax::factory()->percentage()->create(['rate' => 11]);
    $product = Product::factory()->create(['price' => 100_000, 'cost' => 60_000]);

    $this->actingAs($user)->put(route('quotations.update', $quotation), [
        'currency_id' => $currency->id,
        'tax_id' => $tax->id,
        'discount_type' => 'percentage',
        'discount_value' => 10,
        'items' => [
            [
                'product_id' => $product->id,
                'quantity' => 2,
                'unit' => 'Pcs',
                'unit_price' => 100_000,
                'unit_cost' => 60_000,
            ],
        ],
    ]);

    $quotation->refresh();

    expect((float) $quotation->subtotal)->toBe(200_000.0);
    expect((float) $quotation->discount_amount)->toBe(20_000.0);
    expect((float) $quotation->tax_amount)->toBe(19_800.0);
    expect((float) $quotation->total)->toBe(199_800.0);
});

test('groups are replaced and totals recalculated on update', function () {
    $user = User::factory()->create();
    $quotation = Quotation::factory()->create();
    QuotationItem::factory()->create(['quotation_id' => $quotation->id]);
    $currency = Currency::factory()->create();
    $tax = Tax::factory()->percentage()->create(['rate' => 10]);
    $product = Product::factory()->create(['price' => 100_000, 'cost' => 50_000]);

    $response = $this->actingAs($user)->put(route('quotations.update', $quotation), [
        'currency_id' => $currency->id,
        'groups' => [
            [
                'name' => 'Labor',
                'tax_id' => $tax->id,
                'items' => [
                    ['product_id' => $product->id, 'quantity' => 2, 'unit' => 'Pcs', 'unit_price' => 100_000, 'unit_cost' => 50_000],
                ],
            ],
        ],
    ]);

    $response->assertSessionHasNoErrors();

    $quotation->refresh();
    $group = $quotation->groups()->sole();

    expect($group->name)->toBe('Labor');
    expect((float) $group->subtotal)->toBe(200_000.0);
    expect((float) $group->tax_amount)->toBe(20_000.0);
    expect((float) $group->total)->toBe(220_000.0);
    expect((float) $quotation->subtotal)->toBe(220_000.0);
    expect((float) $quotation->total)->toBe(220_000.0);
    expect($quotation->items()->whereNull('quotation_group_id')->count())->toBe(0);
});

test('quotation payment terms snapshot can be updated from a template', function () {
    $user = User::factory()->create();
    $quotation = Quotation::factory()->create();
    QuotationItem::factory()->create(['quotation_id' => $quotation->id]);
    $currency = Currency::factory()->create();
    $product = Product::factory()->create();
    $template = PaymentTermTemplate::factory()->create(['content' => '<p>Updated terms.</p>']);

    $this->actingAs($user)->put(route('quotations.update', $quotation), [
        'currency_id' => $currency->id,
        'payment_term_template_id' => $template->id,
        'payment_terms_html' => '<p>Updated terms.</p>',
        'items' => [
            ['product_id' => $product->id, 'quantity' => 1, 'unit' => 'Pcs', 'unit_price' => 1000, 'unit_cost' => 500],
        ],
    ])->assertSessionHasNoErrors();

    $quotation->refresh();

    expect($quotation->payment_term_template_id)->toBe($template->id);
    expect($quotation->payment_terms_html)->toBe('<p>Updated terms.</p>');
});

test('required fields are validated on update', function () {
    $user = User::factory()->create();
    $quotation = Quotation::factory()->create();

    $this->actingAs($user)
        ->put(route('quotations.update', $quotation), [])
        ->assertSessionHasErrors(['currency_id', 'items']);
});

test('guests cannot edit or update quotations', function () {
    $quotation = Quotation::factory()->create();

    $this->get(route('quotations.edit', $quotation))
        ->assertRedirect(route('login'));

    $this->put(route('quotations.update', $quotation), [])
        ->assertRedirect(route('login'));
});
