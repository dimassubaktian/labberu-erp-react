<?php

namespace App\Models;

use Database\Factories\PurchaseInvoiceFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Support\Carbon;
use Illuminate\Support\Str;

/**
 * @property int $id
 * @property string $uuid
 * @property string $purchase_invoice_code
 * @property int $purchase_order_id
 * @property Carbon $invoice_date
 * @property Carbon $due_date
 * @property string|null $remarks
 * @property string|null $discount_type
 * @property string|null $discount_value
 * @property int|null $tax_id
 * @property string $subtotal
 * @property string $discount_amount
 * @property string $tax_amount
 * @property string $total
 * @property string $status
 * @property string|null $payment_status
 * @property Carbon|null $issued_at
 * @property Carbon|null $created_at
 * @property Carbon|null $updated_at
 * @property Carbon|null $deleted_at
 */
#[Fillable([
    'purchase_order_id',
    'invoice_date',
    'due_date',
    'remarks',
    'discount_type',
    'discount_value',
    'tax_id',
    'subtotal',
    'discount_amount',
    'tax_amount',
    'total',
    'status',
    'payment_status',
    'issued_at',
])]
class PurchaseInvoice extends Model
{
    /** @use HasFactory<PurchaseInvoiceFactory> */
    use HasFactory, SoftDeletes;

    /**
     * Map of each status to the statuses it may transition to.
     *
     * @var array<string, array<int, string>>
     */
    private const array TRANSITIONS = [
        'draft' => ['issued'],
        'issued' => [],
    ];

    /**
     * Get the statuses this purchase invoice may transition to from its current status.
     *
     * @return array<int, string>
     */
    public static function allowedNextStatuses(string $status): array
    {
        return self::TRANSITIONS[$status] ?? [];
    }

    /**
     * Bootstrap the model and its traits.
     */
    protected static function booted(): void
    {
        static::creating(function (PurchaseInvoice $purchaseInvoice): void {
            $purchaseInvoice->uuid ??= (string) Str::uuid();

            if (! $purchaseInvoice->purchase_invoice_code) {
                $purchaseOrder = PurchaseOrder::query()->with('vendor')->findOrFail($purchaseInvoice->purchase_order_id);
                $now = now();
                $number = PurchaseInvoiceCodeSequence::nextNumber((int) $now->format('Y'));

                $purchaseInvoice->purchase_invoice_code = sprintf(
                    'LAB-PINV%s%s%03d-%s',
                    $now->format('y'),
                    $now->format('m'),
                    $number,
                    $purchaseOrder->vendor->vendor_code,
                );
            }
        });
    }

    /**
     * Get the route key for the model.
     */
    public function getRouteKeyName(): string
    {
        return 'uuid';
    }

    /**
     * Get the purchase order this invoice was raised against.
     *
     * @return BelongsTo<PurchaseOrder, $this>
     */
    public function purchaseOrder(): BelongsTo
    {
        return $this->belongsTo(PurchaseOrder::class);
    }

    /**
     * Get the tax applied to this invoice.
     *
     * @return BelongsTo<Tax, $this>
     */
    public function tax(): BelongsTo
    {
        return $this->belongsTo(Tax::class);
    }

    /**
     * Get the line items on this invoice.
     *
     * @return HasMany<PurchaseInvoiceItem, $this>
     */
    public function items(): HasMany
    {
        return $this->hasMany(PurchaseInvoiceItem::class);
    }

    /**
     * Get the payments recorded against this invoice.
     *
     * @return HasMany<PurchaseInvoicePayment, $this>
     */
    public function payments(): HasMany
    {
        return $this->hasMany(PurchaseInvoicePayment::class);
    }

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'invoice_date' => 'date',
            'due_date' => 'date',
            'discount_value' => 'decimal:2',
            'subtotal' => 'decimal:2',
            'discount_amount' => 'decimal:2',
            'tax_amount' => 'decimal:2',
            'total' => 'decimal:2',
            'issued_at' => 'datetime',
            'created_at' => 'datetime',
            'updated_at' => 'datetime',
            'deleted_at' => 'datetime',
        ];
    }
}
