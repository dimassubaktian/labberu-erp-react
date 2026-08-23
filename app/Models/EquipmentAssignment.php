<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Carbon;
use Illuminate\Support\Str;

/**
 * @property int $id
 * @property string $uuid
 * @property int $equipment_id
 * @property int|null $project_id
 * @property int|null $custodian_id
 * @property Carbon $checked_out_at
 * @property Carbon|null $expected_return_at
 * @property Carbon|null $returned_at
 * @property string|null $notes
 * @property string|null $checkout_photo
 * @property string|null $return_photo
 * @property int $created_by
 * @property Carbon|null $created_at
 * @property Carbon|null $updated_at
 */
#[Fillable([
    'equipment_id',
    'project_id',
    'custodian_id',
    'checked_out_at',
    'expected_return_at',
    'returned_at',
    'notes',
    'checkout_photo',
    'return_photo',
    'created_by',
])]
class EquipmentAssignment extends Model
{
    /**
     * Bootstrap the model and its traits.
     */
    protected static function booted(): void
    {
        static::creating(function (EquipmentAssignment $assignment): void {
            $assignment->uuid ??= (string) Str::uuid();
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
     * Get the equipment this assignment belongs to.
     *
     * @return BelongsTo<Equipment, $this>
     */
    public function equipment(): BelongsTo
    {
        return $this->belongsTo(Equipment::class);
    }

    /**
     * Get the project this equipment was checked out to, if any.
     *
     * @return BelongsTo<Project, $this>
     */
    public function project(): BelongsTo
    {
        return $this->belongsTo(Project::class);
    }

    /**
     * Get the workforce member holding this equipment, if any.
     *
     * @return BelongsTo<Workforce, $this>
     */
    public function custodian(): BelongsTo
    {
        return $this->belongsTo(Workforce::class, 'custodian_id');
    }

    /**
     * Get the user who recorded this assignment.
     *
     * @return BelongsTo<User, $this>
     */
    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'checked_out_at' => 'datetime',
            'expected_return_at' => 'date',
            'returned_at' => 'datetime',
            'created_at' => 'datetime',
            'updated_at' => 'datetime',
        ];
    }
}
