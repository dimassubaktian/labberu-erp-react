<?php

namespace App\Models;

use Database\Factories\WorkforceFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Support\Carbon;
use Illuminate\Support\Str;

/**
 * @property int $id
 * @property string $uuid
 * @property string $employee_code
 * @property string $full_name
 * @property string $email
 * @property string|null $phone
 * @property string|null $address
 * @property int $job_title_id
 * @property string $gender
 * @property string|null $photo
 * @property string $status
 * @property Carbon|null $created_at
 * @property Carbon|null $updated_at
 * @property Carbon|null $deleted_at
 */
#[Fillable(['full_name', 'email', 'phone', 'address', 'job_title_id', 'gender', 'photo', 'status'])]
class Workforce extends Model
{
    /** @use HasFactory<WorkforceFactory> */
    use HasFactory, SoftDeletes;

    /**
     * Bootstrap the model and its traits.
     */
    protected static function booted(): void
    {
        static::creating(function (Workforce $workforce): void {
            $workforce->uuid ??= (string) Str::uuid();
            $workforce->employee_code ??= static::nextEmployeeCode();
        });
    }

    /**
     * Get the route key for the model.
     */
    public function getRouteKeyName(): string
    {
        return 'uuid';
    }

    /**
     * Get the job title assigned to the workforce member.
     *
     * @return BelongsTo<JobTitle, $this>
     */
    public function jobTitle(): BelongsTo
    {
        return $this->belongsTo(JobTitle::class);
    }

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'created_at' => 'datetime',
            'updated_at' => 'datetime',
            'deleted_at' => 'datetime',
        ];
    }

    /**
     * Generate the next sequential employee code (e.g. LAB-EMP-001).
     */
    protected static function nextEmployeeCode(): string
    {
        $lastCode = static::withTrashed()
            ->orderByDesc('id')
            ->value('employee_code');

        $nextNumber = $lastCode
            ? ((int) Str::after($lastCode, 'LAB-EMP-')) + 1
            : 1;

        return sprintf('LAB-EMP-%03d', $nextNumber);
    }
}
