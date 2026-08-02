<?php

use App\Models\Quotation;
use App\Models\User;

test('quotations can be searched by code', function () {
    $user = User::factory()->create();
    $approved = Quotation::factory()->create(['status' => 'approved']);
    Quotation::factory()->create(['status' => 'approved']);

    $this->actingAs($user)
        ->getJson(route('quotations.search', ['q' => $approved->quotation_code]))
        ->assertOk()
        ->assertJsonCount(1, 'data')
        ->assertJsonFragment(['id' => $approved->id]);
});

test('only approved quotations are returned by search', function () {
    $user = User::factory()->create();
    Quotation::factory()->create(['status' => 'draft']);
    Quotation::factory()->create(['status' => 'request_for_approval']);
    $approved = Quotation::factory()->create(['status' => 'approved']);

    $this->actingAs($user)
        ->getJson(route('quotations.search'))
        ->assertOk()
        ->assertJsonCount(1, 'data')
        ->assertJsonFragment(['id' => $approved->id]);
});

test('guests cannot search quotations', function () {
    $this->getJson(route('quotations.search'))
        ->assertUnauthorized();
});
