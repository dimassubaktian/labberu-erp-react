<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Carbon;

/**
 * @property int $id
 * @property int $goods_receipt_note_id
 * @property int $product_id
 * @property int|null $purchase_order_item_id
 * @property string $quantity_ordered
 * @property string $unit
 * @property string $quantity_accepted
 * @property string $quantity_rejected
 * @property string|null $rejection_reason
 * @property Carbon|null $created_at
 * @property Carbon|null $updated_at
 */
#[Fillable([
    'goods_receipt_note_id',
    'product_id',
    'purchase_order_item_id',
    'quantity_ordered',
    'unit',
    'quantity_accepted',
    'quantity_rejected',
    'rejection_reason',
])]
class GoodsReceiptNoteItem extends Model
{
    /**
     * Get the goods receipt note this line item belongs to.
     *
     * @return BelongsTo<GoodsReceiptNote, $this>
     */
    public function goodsReceiptNote(): BelongsTo
    {
        return $this->belongsTo(GoodsReceiptNote::class);
    }

    /**
     * Get the purchase order line item this receipt is against, if that item still exists.
     *
     * @return BelongsTo<PurchaseOrderItem, $this>
     */
    public function purchaseOrderItem(): BelongsTo
    {
        return $this->belongsTo(PurchaseOrderItem::class);
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
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'quantity_ordered' => 'decimal:2',
            'quantity_accepted' => 'decimal:2',
            'quantity_rejected' => 'decimal:2',
        ];
    }
}
