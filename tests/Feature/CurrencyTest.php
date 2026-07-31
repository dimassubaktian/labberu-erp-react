<?php

use App\Models\Currency;

test('currency is created with an auto-generated uuid and default status', function () {
    $currency = Currency::factory()->create(['iso_code' => 'USD']);

    expect($currency->uuid)->not->toBeNull();
    expect($currency->iso_code)->toBe('USD');
    expect($currency->status)->toBe('active');
});

test('currency can be soft deleted', function () {
    $currency = Currency::factory()->create();

    $currency->delete();

    expect($currency->deleted_at)->not->toBeNull();
    $this->assertSoftDeleted($currency);
    expect(Currency::find($currency->id))->toBeNull();
    expect(Currency::withTrashed()->find($currency->id))->not->toBeNull();
});

test('iso code of a soft-deleted currency can be reused', function () {
    $trashed = Currency::factory()->create(['iso_code' => 'USD']);
    $trashed->delete();

    $currency = Currency::factory()->create(['iso_code' => 'USD']);

    expect($currency->exists)->toBeTrue();
    expect(Currency::where('iso_code', 'USD')->whereNull('deleted_at')->count())->toBe(1);
});
