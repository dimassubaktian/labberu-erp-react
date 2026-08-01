<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Support\Carbon;
use Illuminate\Support\Str;

/**
 * @property int $id
 * @property string $uuid
 * @property int $quotation_id
 * @property string|null $remarks
 * @property string $main_cost
 * @property string|null $overhead_percentage
 * @property string $overhead_cost
 * @property string $total_cost
 * @property string|null $selling_percentage
 * @property string $selling_cost
 * @property Carbon|null $created_at
 * @property Carbon|null $updated_at
 * @property Carbon|null $deleted_at
 */
#[Fillable([
    'quotation_id',
    'remarks',
    'main_cost',
    'overhead_percentage',
    'overhead_cost',
    'total_cost',
    'selling_percentage',
    'selling_cost',
])]
class Bom extends Model
{
    use SoftDeletes;

    /**
     * Bootstrap the model and its traits.
     */
    protected static function booted(): void
    {
        static::creating(function (Bom $bom): void {
            $bom->uuid ??= (string) Str::uuid();
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
     * Get the quotation this BOM belongs to.
     *
     * @return BelongsTo<Quotation, $this>
     */
    public function quotation(): BelongsTo
    {
        return $this->belongsTo(Quotation::class);
    }

    /**
     * Get the line items on this BOM.
     *
     * @return HasMany<BomItem, $this>
     */
    public function items(): HasMany
    {
        return $this->hasMany(BomItem::class);
    }

    /**
     * Get the item groups on this BOM.
     *
     * @return HasMany<BomGroup, $this>
     */
    public function groups(): HasMany
    {
        return $this->hasMany(BomGroup::class)->orderBy('sort_order');
    }

    /**
     * Get the phase subgroups on this BOM that aren't nested under a hardware group.
     *
     * @return HasMany<BomSubgroup, $this>
     */
    public function subgroups(): HasMany
    {
        return $this->hasMany(BomSubgroup::class)->whereNull('bom_group_id')->orderBy('sort_order');
    }

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'main_cost' => 'decimal:2',
            'overhead_percentage' => 'decimal:2',
            'overhead_cost' => 'decimal:2',
            'total_cost' => 'decimal:2',
            'selling_percentage' => 'decimal:2',
            'selling_cost' => 'decimal:2',
            'created_at' => 'datetime',
            'updated_at' => 'datetime',
            'deleted_at' => 'datetime',
        ];
    }
}
