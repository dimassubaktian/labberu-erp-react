<?php

use App\Models\JobTitle;

test('job title is created with an auto-generated uuid and default status', function () {
    $jobTitle = JobTitle::factory()->create(['name' => 'Software Engineer']);

    expect($jobTitle->uuid)->not->toBeNull();
    expect($jobTitle->name)->toBe('Software Engineer');
    expect($jobTitle->status)->toBe('active');
});

test('job title can be soft deleted', function () {
    $jobTitle = JobTitle::factory()->create();

    $jobTitle->delete();

    expect($jobTitle->deleted_at)->not->toBeNull();
    $this->assertSoftDeleted($jobTitle);
    expect(JobTitle::find($jobTitle->id))->toBeNull();
    expect(JobTitle::withTrashed()->find($jobTitle->id))->not->toBeNull();
});
