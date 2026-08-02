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
 * @property int|null $bom_subgroup_id
 * @property int $product_id
 * @property string|null $description
 * @property string $brand
 * @property string $quantity
 * @property string $unit
 * @property string $unit_cost
 * @property string|null $discount_type
 * @property string|null $discount_value
 * @property string $total_cost
 * @property Carbon|null $created_at
 * @property Carbon|null $updated_at
 */
#[Fillable([
    'bom_id',
    'bom_group_id',
    'bom_subgroup_id',
    'product_id',
    'description',
    'brand',
    'quantity',
    'unit',
    'unit_cost',
    'discount_type',
    'discount_value',
    'total_cost',
])]
class BomItem extends Model
{
    /**
     * Get the BOM this line item belongs to.
     *
     * @return BelongsTo<Bom, $this>
     */
    public function bom(): BelongsTo
    {
        return $this->belongsTo(Bom::class);
    }

    /**
     * Get the group this line item belongs to directly, if any.
     *
     * @return BelongsTo<BomGroup, $this>
     */
    public function group(): BelongsTo
    {
        return $this->belongsTo(BomGroup::class, 'bom_group_id');
    }

    /**
     * Get the phase subgroup this line item belongs to, if any.
     *
     * @return BelongsTo<BomSubgroup, $this>
     */
    public function subgroup(): BelongsTo
    {
        return $this->belongsTo(BomSubgroup::class, 'bom_subgroup_id');
    }

    /**
     * Get the product this line item references.
     *
     * @return BelongsTo<Product, $this>
     */
    public function product(): BelongsTo
    {
        return $this->belongsTo(Product::class);
    }

    /**
     * Get the purchase order line items that were imported from this BOM item.
     *
     * @return HasMany<PurchaseOrderItem, $this>
     */
    public function purchaseOrderItems(): HasMany
    {
        return $this->hasMany(PurchaseOrderItem::class);
    }

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'quantity' => 'decimal:2',
            'unit_cost' => 'decimal:2',
            'discount_value' => 'decimal:2',
            'total_cost' => 'decimal:2',
        ];
    }
}
