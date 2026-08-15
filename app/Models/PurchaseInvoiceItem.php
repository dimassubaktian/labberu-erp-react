<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Carbon;

/**
 * @property int $id
 * @property int $purchase_invoice_id
 * @property int $product_id
 * @property int|null $purchase_order_item_id
 * @property string $quantity_ordered
 * @property string $unit
 * @property string $unit_price
 * @property string $quantity_invoiced
 * @property string $total
 * @property Carbon|null $created_at
 * @property Carbon|null $updated_at
 */
#[Fillable([
    'purchase_invoice_id',
    'product_id',
    'purchase_order_item_id',
    'quantity_ordered',
    'unit',
    'unit_price',
    'quantity_invoiced',
    'total',
])]
class PurchaseInvoiceItem extends Model
{
    /**
     * Get the purchase invoice this line item belongs to.
     *
     * @return BelongsTo<PurchaseInvoice, $this>
     */
    public function purchaseInvoice(): BelongsTo
    {
        return $this->belongsTo(PurchaseInvoice::class);
    }

    /**
     * Get the purchase order line item this invoice line is against, if that item still exists.
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
            'unit_price' => 'decimal:2',
            'quantity_invoiced' => 'decimal:2',
            'total' => 'decimal:2',
        ];
    }
}
