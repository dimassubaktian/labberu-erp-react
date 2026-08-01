<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Support\Carbon;

/**
 * @property int $id
 * @property int $bom_id
 * @property int|null $bom_group_id
 * @property string $name
 * @property int $sort_order
 * @property string $subtotal
 * @property Carbon|null $created_at
 * @property Carbon|null $updated_at
 */
#[Fillable([
    'bom_id',
    'bom_group_id',
    'name',
    'sort_order',
    'subtotal',
])]
class BomSubgroup extends Model
{
    /**
     * Get the BOM this subgroup belongs to.
     *
     * @return BelongsTo<Bom, $this>
     */
    public function bom(): BelongsTo
    {
        return $this->belongsTo(Bom::class);
    }

    /**
     * Get the hardware group this phase subgroup belongs to, if any.
     *
     * @return BelongsTo<BomGroup, $this>
     */
    public function group(): BelongsTo
    {
        return $this->belongsTo(BomGroup::class, 'bom_group_id');
    }

    /**
     * Get the line items in this subgroup.
     *
     * @return HasMany<BomItem, $this>
     */
    public function items(): HasMany
    {
        return $this->hasMany(BomItem::class);
    }

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'subtotal' => 'decimal:2',
            'created_at' => 'datetime',
            'updated_at' => 'datetime',
        ];
    }
}
