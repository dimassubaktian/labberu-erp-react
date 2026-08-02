<?php

namespace App\Models;

use Database\Factories\QuotationItemFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Support\Carbon;

/**
 * @property int $id
 * @property int $quotation_id
 * @property int|null $quotation_group_id
 * @property int $product_id
 * @property string|null $description
 * @property string $quantity
 * @property string $unit
 * @property string $unit_price
 * @property string $unit_cost
 * @property string|null $discount_type
 * @property string|null $discount_value
 * @property string $total_price
 * @property string $total_cost
 * @property string $margin
 * @property string $margin_percent
 * @property Carbon|null $created_at
 * @property Carbon|null $updated_at
 */
#[Fillable([
    'quotation_id',
    'quotation_group_id',
    'product_id',
    'description',
    'quantity',
    'unit',
    'unit_price',
    'unit_cost',
    'discount_type',
    'discount_value',
    'total_price',
    'total_cost',
    'margin',
    'margin_percent',
])]
class QuotationItem extends Model
{
    /** @use HasFactory<QuotationItemFactory> */
    use HasFactory;

    /**
     * Get the quotation this line item belongs to.
     *
     * @return BelongsTo<Quotation, $this>
     */
    public function quotation(): BelongsTo
    {
        return $this->belongsTo(Quotation::class);
    }

    /**
     * Get the group this line item belongs to, if any.
     *
     * @return BelongsTo<QuotationGroup, $this>
     */
    public function group(): BelongsTo
    {
        return $this->belongsTo(QuotationGroup::class, 'quotation_group_id');
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
     * Get the delivery order line items recorded against this line item.
     *
     * @return HasMany<DeliveryOrderItem, $this>
     */
    public function deliveryOrderItems(): HasMany
    {
        return $this->hasMany(DeliveryOrderItem::class);
    }

    /**
     * Get the invoice line items recorded against this line item.
     *
     * @return HasMany<InvoiceItem, $this>
     */
    public function invoiceItems(): HasMany
    {
        return $this->hasMany(InvoiceItem::class);
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
            'unit_price' => 'decimal:2',
            'unit_cost' => 'decimal:2',
            'discount_value' => 'decimal:2',
            'total_price' => 'decimal:2',
            'total_cost' => 'decimal:2',
            'margin' => 'decimal:2',
            'margin_percent' => 'decimal:2',
        ];
    }
}
