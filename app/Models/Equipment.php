<?php

namespace App\Models;

use Database\Factories\EquipmentFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

/**
 * @property int $id
 * @property string $uuid
 * @property string $equipment_code
 * @property string $name
 * @property string|null $category
 * @property string|null $model_type
 * @property string|null $serial_number
 * @property string|null $brand
 * @property string|null $picture
 * @property Carbon|null $purchase_date
 * @property string|null $purchase_cost
 * @property int|null $vendor_id
 * @property Carbon|null $warranty_expiry_date
 * @property bool $calibration_required
 * @property int|null $calibration_interval_months
 * @property Carbon|null $next_calibration_due_date
 * @property string $status
 * @property int|null $current_project_id
 * @property int|null $current_custodian_id
 * @property string|null $remarks
 * @property Carbon|null $created_at
 * @property Carbon|null $updated_at
 * @property Carbon|null $deleted_at
 */
#[Fillable([
    'name',
    'category',
    'model_type',
    'serial_number',
    'brand',
    'picture',
    'purchase_date',
    'purchase_cost',
    'vendor_id',
    'warranty_expiry_date',
    'calibration_required',
    'calibration_interval_months',
    'status',
    'remarks',
])]
class Equipment extends Model
{
    /** @use HasFactory<EquipmentFactory> */
    use HasFactory, SoftDeletes;

    /**
     * Bootstrap the model and its traits.
     */
    protected static function booted(): void
    {
        static::creating(function (Equipment $equipment): void {
            $equipment->uuid ??= (string) Str::uuid();
            $equipment->equipment_code ??= static::nextEquipmentCode();
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
     * Get the vendor this equipment was purchased from.
     *
     * @return BelongsTo<Vendor, $this>
     */
    public function vendor(): BelongsTo
    {
        return $this->belongsTo(Vendor::class);
    }

    /**
     * Get the project this equipment is currently assigned to, if any.
     *
     * @return BelongsTo<Project, $this>
     */
    public function currentProject(): BelongsTo
    {
        return $this->belongsTo(Project::class, 'current_project_id');
    }

    /**
     * Get the workforce member currently holding this equipment, if any.
     *
     * @return BelongsTo<Workforce, $this>
     */
    public function currentCustodian(): BelongsTo
    {
        return $this->belongsTo(Workforce::class, 'current_custodian_id');
    }

    /**
     * Get the calibration certificate history for this equipment.
     *
     * @return HasMany<EquipmentCalibration, $this>
     */
    public function calibrations(): HasMany
    {
        return $this->hasMany(EquipmentCalibration::class)->latest('due_date');
    }

    /**
     * Get the custody/usage history for this equipment.
     *
     * @return HasMany<EquipmentAssignment, $this>
     */
    public function assignments(): HasMany
    {
        return $this->hasMany(EquipmentAssignment::class)->latest('checked_out_at');
    }

    /**
     * Check out this equipment to a project and/or custodian. Any currently open assignment is
     * closed first, so equipment only ever has one active location at a time.
     *
     * @param  array<string, mixed>  $data
     */
    public function checkOut(array $data): EquipmentAssignment
    {
        return DB::transaction(function () use ($data): EquipmentAssignment {
            $this->assignments()
                ->whereNull('returned_at')
                ->update(['returned_at' => $data['checked_out_at']]);

            $assignment = $this->assignments()->create($data);
            $this->syncCurrentAssignment();

            return $assignment;
        });
    }

    /**
     * Determine whether this equipment's most recent calibration is recent enough to satisfy a
     * project's required calibration freshness (some customers require proof of calibration
     * within, say, the last 6 months, which can be stricter than the certificate's own due
     * date). Equipment that doesn't require calibration is always exempt, and a project with no
     * requirement (null) never blocks anything.
     */
    public function satisfiesCalibrationRecency(?int $maxAgeMonths, ?Carbon $asOf = null): bool
    {
        if ($maxAgeMonths === null || ! $this->calibration_required) {
            return true;
        }

        $lastCalibratedAt = $this->calibrations()->max('calibration_date');

        if ($lastCalibratedAt === null) {
            return false;
        }

        return Carbon::parse($lastCalibratedAt)->greaterThanOrEqualTo(
            ($asOf ?? now())->copy()->subMonths($maxAgeMonths)
        );
    }

    /**
     * Sync the denormalized current project/custodian and status from the latest open
     * assignment (the one with no returned_at). Called after an assignment is checked
     * out or returned so the equipment index/show pages don't need to join history tables.
     */
    public function syncCurrentAssignment(): void
    {
        $open = $this->assignments()->whereNull('returned_at')->first();

        $this->current_project_id = $open?->project_id;
        $this->current_custodian_id = $open?->custodian_id;

        if (in_array($this->status, ['available', 'in_use'])) {
            $this->status = $open ? 'in_use' : 'available';
        }

        $this->saveQuietly();
    }

    /**
     * Recompute and persist next_calibration_due_date from the latest calibration record.
     */
    public function recomputeCalibration(): void
    {
        $this->next_calibration_due_date = $this->calibrations()->value('due_date');

        $this->saveQuietly();
    }

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'purchase_date' => 'date',
            'purchase_cost' => 'decimal:2',
            'warranty_expiry_date' => 'date',
            'calibration_required' => 'boolean',
            'next_calibration_due_date' => 'date',
            'created_at' => 'datetime',
            'updated_at' => 'datetime',
            'deleted_at' => 'datetime',
        ];
    }

    /**
     * Generate the next sequential equipment code (e.g. LAB-EQP-001).
     */
    protected static function nextEquipmentCode(): string
    {
        $lastCode = static::withTrashed()
            ->orderByDesc('id')
            ->value('equipment_code');

        $nextNumber = $lastCode
            ? ((int) Str::after($lastCode, 'LAB-EQP-')) + 1
            : 1;

        return sprintf('LAB-EQP-%03d', $nextNumber);
    }
}
