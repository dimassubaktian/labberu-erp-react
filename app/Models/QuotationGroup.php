<?php

namespace App\Models;

use Database\Factories\QuotationGroupFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Support\Carbon;

/**
 * @property int $id
 * @property int $quotation_id
 * @property string $name
 * @property int $sort_order
 * @property string|null $discount_type
 * @property string|null $discount_value
 * @property int|null $tax_id
 * @property string $subtotal
 * @property string $discount_amount
 * @property string $tax_amount
 * @property string $total
 * @property Carbon|null $created_at
 * @property Carbon|null $updated_at
 */
#[Fillable([
    'quotation_id',
    'name',
    'sort_order',
    'discount_type',
    'discount_value',
    'tax_id',
    'subtotal',
    'discount_amount',
    'tax_amount',
    'total',
])]
class QuotationGroup extends Model
{
    /** @use HasFactory<QuotationGroupFactory> */
    use HasFactory;

    /**
     * Get the quotation this group belongs to.
     *
     * @return BelongsTo<Quotation, $this>
     */
    public function quotation(): BelongsTo
    {
        return $this->belongsTo(Quotation::class);
    }

    /**
     * Get the tax applied to this group.
     *
     * @return BelongsTo<Tax, $this>
     */
    public function tax(): BelongsTo
    {
        return $this->belongsTo(Tax::class);
    }

    /**
     * Get the line items in this group.
     *
     * @return HasMany<QuotationItem, $this>
     */
    public function items(): HasMany
    {
        return $this->hasMany(QuotationItem::class);
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
            'subtotal' => 'decimal:2',
            'discount_amount' => 'decimal:2',
            'tax_amount' => 'decimal:2',
            'total' => 'decimal:2',
            'created_at' => 'datetime',
            'updated_at' => 'datetime',
        ];
    }
}
