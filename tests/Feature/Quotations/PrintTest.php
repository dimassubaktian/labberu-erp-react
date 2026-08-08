<?php

use App\Models\Quotation;
use App\Models\QuotationGroup;
use App\Models\QuotationItem;
use App\Models\User;

test('quotation print streams pdf inline by default', function () {
    $user = User::factory()->create();
    $quotation = Quotation::factory()->create();
    QuotationItem::factory()->create(['quotation_id' => $quotation->id]);

    $response = $this->actingAs($user)
        ->get(route('quotations.print', $quotation));

    $response->assertOk();
    $response->assertHeader('Content-Type', 'application/pdf');
    expect($response->headers->get('Content-Disposition'))->toContain('inline');
});

test('quotation print forces download when download param is true', function () {
    $user = User::factory()->create();
    $quotation = Quotation::factory()->create();
    QuotationItem::factory()->create(['quotation_id' => $quotation->id]);

    $response = $this->actingAs($user)
        ->get(route('quotations.print', [$quotation, 'download' => 'true']));

    $response->assertOk();
    $response->assertHeader('Content-Type', 'application/pdf');
    expect($response->headers->get('Content-Disposition'))->toContain('attachment');
    expect($response->headers->get('Content-Disposition'))->toContain("quotation-{$quotation->quotation_code}.pdf");
});

test('quotation print renders ok with payment terms html set', function () {
    $user = User::factory()->create();
    $quotation = Quotation::factory()->create([
        'payment_terms_html' => '<h3>Terms</h3><ul><li>Down payment 40%</li><li><strong>Balance</strong> due on delivery</li></ul>',
    ]);
    QuotationItem::factory()->create(['quotation_id' => $quotation->id]);

    $response = $this->actingAs($user)
        ->get(route('quotations.print', $quotation));

    $response->assertOk();
    $response->assertHeader('Content-Type', 'application/pdf');
});

test('quotation print requires authentication', function () {
    $quotation = Quotation::factory()->create();

    $this->get(route('quotations.print', $quotation))
        ->assertRedirect(route('login'));
});

test('quotation print accepts a partial group selection', function () {
    $user = User::factory()->create();
    $quotation = Quotation::factory()->create();
    $groupA = QuotationGroup::factory()->create(['quotation_id' => $quotation->id]);
    $groupB = QuotationGroup::factory()->create(['quotation_id' => $quotation->id]);
    QuotationItem::factory()->create(['quotation_id' => $quotation->id, 'quotation_group_id' => $groupA->id]);
    QuotationItem::factory()->create(['quotation_id' => $quotation->id, 'quotation_group_id' => $groupB->id]);
    QuotationItem::factory()->create(['quotation_id' => $quotation->id]);

    $response = $this->actingAs($user)
        ->get(route('quotations.print', [$quotation, 'group_ids' => [$groupA->id], 'include_ungrouped' => '0']));

    $response->assertOk();
    $response->assertHeader('Content-Type', 'application/pdf');
});

test('quotation print treats an explicit selection of every group as a full print', function () {
    $user = User::factory()->create();
    $quotation = Quotation::factory()->create();
    $group = QuotationGroup::factory()->create(['quotation_id' => $quotation->id]);
    QuotationItem::factory()->create(['quotation_id' => $quotation->id, 'quotation_group_id' => $group->id]);

    $response = $this->actingAs($user)
        ->get(route('quotations.print', [$quotation, 'group_ids' => [$group->id], 'include_ungrouped' => '1']));

    $response->assertOk();
    $response->assertHeader('Content-Type', 'application/pdf');
});

test('quotation print handles an empty selection without erroring', function () {
    $user = User::factory()->create();
    $quotation = Quotation::factory()->create();
    $group = QuotationGroup::factory()->create(['quotation_id' => $quotation->id]);
    QuotationItem::factory()->create(['quotation_id' => $quotation->id, 'quotation_group_id' => $group->id]);
    QuotationItem::factory()->create(['quotation_id' => $quotation->id]);

    $response = $this->actingAs($user)
        ->get(route('quotations.print', [$quotation, 'group_ids' => [], 'include_ungrouped' => '0']));

    $response->assertOk();
    $response->assertHeader('Content-Type', 'application/pdf');
});
