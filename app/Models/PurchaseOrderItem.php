<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Support\Carbon;

/**
 * @property int $id
 * @property int $purchase_order_id
 * @property int $product_id
 * @property int|null $bom_item_id
 * @property string|null $reference_number
 * @property string|null $description
 * @property string $quantity
 * @property string $unit
 * @property string $unit_price
 * @property string $total
 * @property Carbon|null $created_at
 * @property Carbon|null $updated_at
 */
#[Fillable([
    'purchase_order_id',
    'product_id',
    'bom_item_id',
    'reference_number',
    'description',
    'quantity',
    'unit',
    'unit_price',
    'total',
])]
class PurchaseOrderItem extends Model
{
    /**
     * Get the purchase order this line item belongs to.
     *
     * @return BelongsTo<PurchaseOrder, $this>
     */
    public function purchaseOrder(): BelongsTo
    {
        return $this->belongsTo(PurchaseOrder::class);
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
     * Get the BOM line item this line item was imported from, if any.
     *
     * @return BelongsTo<BomItem, $this>
     */
    public function bomItem(): BelongsTo
    {
        return $this->belongsTo(BomItem::class);
    }

    /**
     * Get the goods receipt note line items recorded against this line item.
     *
     * @return HasMany<GoodsReceiptNoteItem, $this>
     */
    public function goodsReceiptNoteItems(): HasMany
    {
        return $this->hasMany(GoodsReceiptNoteItem::class);
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
            'total' => 'decimal:2',
        ];
    }
}
