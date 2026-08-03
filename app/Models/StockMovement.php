<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Carbon;

/**
 * @property int $id
 * @property int $product_id
 * @property string $type
 * @property string $quantity
 * @property Carbon $movement_date
 * @property int|null $goods_receipt_note_item_id
 * @property int|null $delivery_order_item_id
 * @property int|null $stock_adjustment_id
 * @property Carbon|null $created_at
 * @property Carbon|null $updated_at
 */
#[Fillable([
    'product_id',
    'type',
    'quantity',
    'movement_date',
    'goods_receipt_note_item_id',
    'delivery_order_item_id',
    'stock_adjustment_id',
])]
class StockMovement extends Model
{
    /**
     * Get the total quantity of the given product currently on hand, computed live from the
     * sum of its stock movements rather than a stored, synchronizable figure.
     */
    public static function quantityOnHandFor(Product $product): float
    {
        return (float) static::query()
            ->where('product_id', $product->id)
            ->selectRaw("coalesce(sum(case when type = 'in' then quantity else -quantity end), 0) as balance")
            ->value('balance');
    }

    /**
     * Get the product this movement affects.
     *
     * @return BelongsTo<Product, $this>
     */
    public function product(): BelongsTo
    {
        return $this->belongsTo(Product::class);
    }

    /**
     * Get the goods receipt note line item this "in" movement came from, if any.
     *
     * @return BelongsTo<GoodsReceiptNoteItem, $this>
     */
    public function goodsReceiptNoteItem(): BelongsTo
    {
        return $this->belongsTo(GoodsReceiptNoteItem::class);
    }

    /**
     * Get the delivery order line item this "out" movement came from, if any.
     *
     * @return BelongsTo<DeliveryOrderItem, $this>
     */
    public function deliveryOrderItem(): BelongsTo
    {
        return $this->belongsTo(DeliveryOrderItem::class);
    }

    /**
     * Get the stock adjustment this movement came from, if any.
     *
     * @return BelongsTo<StockAdjustment, $this>
     */
    public function stockAdjustment(): BelongsTo
    {
        return $this->belongsTo(StockAdjustment::class);
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
            'movement_date' => 'date',
            'created_at' => 'datetime',
            'updated_at' => 'datetime',
        ];
    }
}
