<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Carbon;

/**
 * @property int $id
 * @property int $purchase_order_id
 * @property int $sequence
 * @property string $label
 * @property string $discount_type
 * @property string $discount_value
 * @property string $base_amount
 * @property string $discount_amount
 * @property Carbon|null $created_at
 * @property Carbon|null $updated_at
 */
#[Fillable([
    'purchase_order_id',
    'sequence',
    'label',
    'discount_type',
    'discount_value',
    'base_amount',
    'discount_amount',
])]
class PurchaseOrderDiscount extends Model
{
    /**
     * Get the purchase order this discount level belongs to.
     *
     * @return BelongsTo<PurchaseOrder, $this>
     */
    public function purchaseOrder(): BelongsTo
    {
        return $this->belongsTo(PurchaseOrder::class);
    }

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'discount_value' => 'decimal:2',
            'base_amount' => 'decimal:2',
            'discount_amount' => 'decimal:2',
        ];
    }
}
