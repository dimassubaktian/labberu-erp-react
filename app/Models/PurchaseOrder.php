<?php

namespace App\Models;

use Database\Factories\PurchaseOrderFactory;
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
 * @property string $purchase_order_code
 * @property int $project_id
 * @property int $quotation_id
 * @property int $customer_id
 * @property int $vendor_id
 * @property string|null $address
 * @property string|null $attention
 * @property string|null $phone
 * @property string|null $fax
 * @property string|null $quotation_no
 * @property Carbon|null $quotation_date
 * @property string $project_name
 * @property Carbon $date
 * @property int $currency_id
 * @property int|null $tax_id
 * @property string|null $shipping_method
 * @property string|null $shipping_terms
 * @property string|null $notes_html
 * @property Carbon|null $delivery_date
 * @property string $subtotal
 * @property string $discount_total
 * @property string $net_after_discount
 * @property string $tax_amount
 * @property string $grand_total
 * @property string $status
 * @property string|null $progress
 * @property int|null $issued_by_id
 * @property Carbon|null $issued_at
 * @property int|null $checked_by_1_id
 * @property Carbon|null $checked_by_1_at
 * @property int|null $checked_by_2_id
 * @property Carbon|null $checked_by_2_at
 * @property int|null $approved_by_id
 * @property Carbon|null $approved_at
 * @property string|null $rejection_reason
 * @property Carbon|null $created_at
 * @property Carbon|null $updated_at
 * @property Carbon|null $deleted_at
 */
#[Fillable([
    'project_id',
    'quotation_id',
    'customer_id',
    'vendor_id',
    'address',
    'attention',
    'phone',
    'fax',
    'quotation_no',
    'quotation_date',
    'project_name',
    'date',
    'currency_id',
    'tax_id',
    'shipping_method',
    'shipping_terms',
    'notes_html',
    'delivery_date',
    'subtotal',
    'discount_total',
    'net_after_discount',
    'tax_amount',
    'grand_total',
    'status',
    'progress',
    'issued_by_id',
    'issued_at',
    'checked_by_1_id',
    'checked_by_1_at',
    'checked_by_2_id',
    'checked_by_2_at',
    'approved_by_id',
    'approved_at',
    'rejection_reason',
])]
class PurchaseOrder extends Model
{
    /** @use HasFactory<PurchaseOrderFactory> */
    use HasFactory, SoftDeletes;

    /**
     * Map of each status to the statuses it may transition to.
     *
     * @var array<string, array<int, string>>
     */
    private const array TRANSITIONS = [
        'draft' => ['issued', 'cancelled'],
        'issued' => ['approved', 'draft', 'cancelled'],
        'approved' => ['voided', 'draft'],
        'cancelled' => [],
        'voided' => [],
    ];

    /**
     * Get the statuses this purchase order may transition to from its current status.
     *
     * @return array<int, string>
     */
    public static function allowedNextStatuses(string $status): array
    {
        return self::TRANSITIONS[$status] ?? [];
    }

    /**
     * Map of each post-approval progress stage to the stages it may move to next. This tracks
     * the vendor fulfillment of an approved purchase order, separate from its internal
     * issue/check/approve `status`.
     *
     * @var array<string, array<int, string>>
     */
    private const array PROGRESS_TRANSITIONS = [
        '' => ['sent'],
        'sent' => ['partially_received', 'fully_received'],
        'partially_received' => ['fully_received'],
        'fully_received' => ['closed'],
        'closed' => [],
    ];

    /**
     * Get the progress stages this purchase order may move to from its current progress.
     *
     * @return array<int, string>
     */
    public static function allowedNextProgress(?string $progress): array
    {
        return self::PROGRESS_TRANSITIONS[$progress ?? ''] ?? [];
    }

    /**
     * Bootstrap the model and its traits.
     */
    protected static function booted(): void
    {
        static::creating(function (PurchaseOrder $purchaseOrder): void {
            $purchaseOrder->uuid ??= (string) Str::uuid();

            if (! $purchaseOrder->purchase_order_code) {
                $vendor = Vendor::query()->findOrFail($purchaseOrder->vendor_id);
                $now = now();
                $number = PurchaseOrderCodeSequence::nextNumber((int) $now->format('Y'));

                $purchaseOrder->purchase_order_code = sprintf(
                    'LAB-PO%s%s%03d-%s',
                    $now->format('y'),
                    $now->format('m'),
                    $number,
                    $vendor->vendor_code,
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
     * Get the project this purchase order belongs to.
     *
     * @return BelongsTo<Project, $this>
     */
    public function project(): BelongsTo
    {
        return $this->belongsTo(Project::class);
    }

    /**
     * Get the quotation this purchase order was raised against.
     *
     * @return BelongsTo<Quotation, $this>
     */
    public function quotation(): BelongsTo
    {
        return $this->belongsTo(Quotation::class);
    }

    /**
     * Get the customer this purchase order's underlying project belongs to.
     *
     * @return BelongsTo<Customer, $this>
     */
    public function customer(): BelongsTo
    {
        return $this->belongsTo(Customer::class);
    }

    /**
     * Get the vendor this purchase order is issued to.
     *
     * @return BelongsTo<Vendor, $this>
     */
    public function vendor(): BelongsTo
    {
        return $this->belongsTo(Vendor::class);
    }

    /**
     * Get the currency this purchase order is priced in.
     *
     * @return BelongsTo<Currency, $this>
     */
    public function currency(): BelongsTo
    {
        return $this->belongsTo(Currency::class);
    }

    /**
     * Get the tax applied to this purchase order.
     *
     * @return BelongsTo<Tax, $this>
     */
    public function tax(): BelongsTo
    {
        return $this->belongsTo(Tax::class);
    }

    /**
     * Get the workforce member who issued this purchase order.
     *
     * @return BelongsTo<Workforce, $this>
     */
    public function issuedBy(): BelongsTo
    {
        return $this->belongsTo(Workforce::class, 'issued_by_id');
    }

    /**
     * Get the workforce member who signed off as the first checker.
     *
     * @return BelongsTo<Workforce, $this>
     */
    public function checkedByFirst(): BelongsTo
    {
        return $this->belongsTo(Workforce::class, 'checked_by_1_id');
    }

    /**
     * Get the workforce member who signed off as the second checker.
     *
     * @return BelongsTo<Workforce, $this>
     */
    public function checkedBySecond(): BelongsTo
    {
        return $this->belongsTo(Workforce::class, 'checked_by_2_id');
    }

    /**
     * Get the workforce member who approved this purchase order.
     *
     * @return BelongsTo<Workforce, $this>
     */
    public function approvedBy(): BelongsTo
    {
        return $this->belongsTo(Workforce::class, 'approved_by_id');
    }

    /**
     * Get the cascading discount levels applied to this purchase order.
     *
     * @return HasMany<PurchaseOrderDiscount, $this>
     */
    public function discounts(): HasMany
    {
        return $this->hasMany(PurchaseOrderDiscount::class)->orderBy('sequence');
    }

    /**
     * Get the line items on this purchase order.
     *
     * @return HasMany<PurchaseOrderItem, $this>
     */
    public function items(): HasMany
    {
        return $this->hasMany(PurchaseOrderItem::class);
    }

    /**
     * Get the goods receipt notes raised against this purchase order.
     *
     * @return HasMany<GoodsReceiptNote, $this>
     */
    public function goodsReceiptNotes(): HasMany
    {
        return $this->hasMany(GoodsReceiptNote::class);
    }

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'quotation_date' => 'date',
            'date' => 'date',
            'delivery_date' => 'date',
            'subtotal' => 'decimal:2',
            'discount_total' => 'decimal:2',
            'net_after_discount' => 'decimal:2',
            'tax_amount' => 'decimal:2',
            'grand_total' => 'decimal:2',
            'issued_at' => 'datetime',
            'checked_by_1_at' => 'datetime',
            'checked_by_2_at' => 'datetime',
            'approved_at' => 'datetime',
            'created_at' => 'datetime',
            'updated_at' => 'datetime',
            'deleted_at' => 'datetime',
        ];
    }
}
