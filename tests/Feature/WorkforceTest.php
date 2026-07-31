<?php

use App\Models\JobTitle;
use App\Models\Workforce;

test('workforce is created with an auto-generated uuid, employee code, and default status', function () {
    $workforce = Workforce::factory()->create(['full_name' => 'Jane Doe']);

    expect($workforce->uuid)->not->toBeNull();
    expect($workforce->employee_code)->toBe('LAB-EMP-001');
    expect($workforce->full_name)->toBe('Jane Doe');
    expect($workforce->status)->toBe('active');
});

test('employee codes increment sequentially', function () {
    $first = Workforce::factory()->create();
    $second = Workforce::factory()->create();
    $third = Workforce::factory()->create();

    expect($first->employee_code)->toBe('LAB-EMP-001');
    expect($second->employee_code)->toBe('LAB-EMP-002');
    expect($third->employee_code)->toBe('LAB-EMP-003');
});

test('employee codes are not reused after a soft delete', function () {
    $first = Workforce::factory()->create();
    $first->delete();

    $second = Workforce::factory()->create();

    expect($second->employee_code)->toBe('LAB-EMP-002');
});

test('workforce belongs to a job title', function () {
    $jobTitle = JobTitle::factory()->create();
    $workforce = Workforce::factory()->create(['job_title_id' => $jobTitle->id]);

    expect($workforce->jobTitle->is($jobTitle))->toBeTrue();
});

test('workforce can be soft deleted', function () {
    $workforce = Workforce::factory()->create();

    $workforce->delete();

    expect($workforce->deleted_at)->not->toBeNull();
    $this->assertSoftDeleted($workforce);
    expect(Workforce::find($workforce->id))->toBeNull();
    expect(Workforce::withTrashed()->find($workforce->id))->not->toBeNull();
});
