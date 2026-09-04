<?php

namespace App\Models;

use App\Http\Controllers\DashboardController;
use Database\Factories\GoodsReceiptNoteFactory;
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
 * @property string $grn_code
 * @property int $purchase_order_id
 * @property Carbon $received_date
 * @property string|null $remarks
 * @property string|null $cancel_reason
 * @property string $status
 * @property int|null $received_by_id
 * @property Carbon|null $received_at
 * @property Carbon|null $created_at
 * @property Carbon|null $updated_at
 * @property Carbon|null $deleted_at
 */
#[Fillable([
    'purchase_order_id',
    'received_date',
    'remarks',
    'cancel_reason',
    'status',
    'received_by_id',
    'received_at',
])]
class GoodsReceiptNote extends Model
{
    /** @use HasFactory<GoodsReceiptNoteFactory> */
    use HasFactory, SoftDeletes;

    /**
     * Map of each status to the statuses it may transition to.
     *
     * @var array<string, array<int, string>>
     */
    private const array TRANSITIONS = [
        'draft' => ['confirmed'],
        'confirmed' => ['cancelled'],
        'cancelled' => [],
    ];

    /**
     * Get the statuses this goods receipt note may transition to from its current status.
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
        static::creating(function (GoodsReceiptNote $goodsReceiptNote): void {
            $goodsReceiptNote->uuid ??= (string) Str::uuid();

            if (! $goodsReceiptNote->grn_code) {
                $purchaseOrder = PurchaseOrder::query()->with('vendor')->findOrFail($goodsReceiptNote->purchase_order_id);
                $now = now();
                $number = GoodsReceiptNoteCodeSequence::nextNumber((int) $now->format('Y'));

                $goodsReceiptNote->grn_code = sprintf(
                    'LAB-GRN%s%03d-%s',
                    $now->format('y'),
                    $number,
                    $purchaseOrder->vendor->vendor_code,
                );
            }
        });

        static::saved(fn () => DashboardController::flushCache());
        static::deleted(fn () => DashboardController::flushCache());
        static::restored(fn () => DashboardController::flushCache());
    }

    /**
     * Get the route key for the model.
     */
    public function getRouteKeyName(): string
    {
        return 'uuid';
    }

    /**
     * Get the purchase order this goods receipt note was raised against.
     *
     * @return BelongsTo<PurchaseOrder, $this>
     */
    public function purchaseOrder(): BelongsTo
    {
        return $this->belongsTo(PurchaseOrder::class);
    }

    /**
     * Get the workforce member who received the goods.
     *
     * @return BelongsTo<Workforce, $this>
     */
    public function receivedBy(): BelongsTo
    {
        return $this->belongsTo(Workforce::class, 'received_by_id');
    }

    /**
     * Get the line items on this goods receipt note.
     *
     * @return HasMany<GoodsReceiptNoteItem, $this>
     */
    public function items(): HasMany
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
            'received_date' => 'date',
            'received_at' => 'datetime',
            'created_at' => 'datetime',
            'updated_at' => 'datetime',
            'deleted_at' => 'datetime',
        ];
    }
}
