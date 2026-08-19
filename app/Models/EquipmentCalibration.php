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
 * @property string|null $certificate_number
 * @property Carbon $calibration_date
 * @property Carbon $due_date
 * @property int|null $provider_id
 * @property string $result
 * @property string|null $certificate_file
 * @property string|null $cost
 * @property string|null $notes
 * @property int $created_by
 * @property Carbon|null $created_at
 * @property Carbon|null $updated_at
 */
#[Fillable([
    'equipment_id',
    'certificate_number',
    'calibration_date',
    'due_date',
    'provider_id',
    'result',
    'certificate_file',
    'cost',
    'notes',
    'created_by',
])]
class EquipmentCalibration extends Model
{
    /**
     * Bootstrap the model and its traits.
     */
    protected static function booted(): void
    {
        static::creating(function (EquipmentCalibration $calibration): void {
            $calibration->uuid ??= (string) Str::uuid();
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
     * Get the equipment this calibration certificate belongs to.
     *
     * @return BelongsTo<Equipment, $this>
     */
    public function equipment(): BelongsTo
    {
        return $this->belongsTo(Equipment::class);
    }

    /**
     * Get the vendor who performed the calibration.
     *
     * @return BelongsTo<Vendor, $this>
     */
    public function provider(): BelongsTo
    {
        return $this->belongsTo(Vendor::class, 'provider_id');
    }

    /**
     * Get the user who recorded this calibration.
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
            'calibration_date' => 'date',
            'due_date' => 'date',
            'cost' => 'decimal:2',
            'created_at' => 'datetime',
            'updated_at' => 'datetime',
        ];
    }
}
