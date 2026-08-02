<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Carbon;

/**
 * @property int $id
 * @property int $invoice_id
 * @property int $product_id
 * @property int|null $quotation_item_id
 * @property string $quantity_ordered
 * @property string $unit
 * @property string $unit_price
 * @property string $quantity_invoiced
 * @property string $total
 * @property Carbon|null $created_at
 * @property Carbon|null $updated_at
 */
#[Fillable([
    'invoice_id',
    'product_id',
    'quotation_item_id',
    'quantity_ordered',
    'unit',
    'unit_price',
    'quantity_invoiced',
    'total',
])]
class InvoiceItem extends Model
{
    /**
     * Get the invoice this line item belongs to.
     *
     * @return BelongsTo<Invoice, $this>
     */
    public function invoice(): BelongsTo
    {
        return $this->belongsTo(Invoice::class);
    }

    /**
     * Get the quotation line item this invoice line is against, if that item still exists.
     *
     * @return BelongsTo<QuotationItem, $this>
     */
    public function quotationItem(): BelongsTo
    {
        return $this->belongsTo(QuotationItem::class);
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
