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
 * @property string $name
 * @property int $sort_order
 * @property string $subtotal
 * @property Carbon|null $created_at
 * @property Carbon|null $updated_at
 */
#[Fillable([
    'bom_id',
    'name',
    'sort_order',
    'subtotal',
])]
class BomGroup extends Model
{
    /**
     * Get the BOM this group belongs to.
     *
     * @return BelongsTo<Bom, $this>
     */
    public function bom(): BelongsTo
    {
        return $this->belongsTo(Bom::class);
    }

    /**
     * Get the line items directly in this group (not inside a phase subgroup).
     *
     * @return HasMany<BomItem, $this>
     */
    public function items(): HasMany
    {
        return $this->hasMany(BomItem::class);
    }

    /**
     * Get the phase subgroups nested under this hardware group.
     *
     * @return HasMany<BomSubgroup, $this>
     */
    public function subgroups(): HasMany
    {
        return $this->hasMany(BomSubgroup::class)->orderBy('sort_order');
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
