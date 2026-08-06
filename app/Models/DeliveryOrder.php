<?php

namespace App\Models;

use Database\Factories\DeliveryOrderFactory;
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
 * @property string $do_code
 * @property int $quotation_id
 * @property Carbon $delivery_date
 * @property string|null $remarks
 * @property string $status
 * @property int|null $delivered_by_id
 * @property Carbon|null $delivered_at
 * @property Carbon|null $created_at
 * @property Carbon|null $updated_at
 * @property Carbon|null $deleted_at
 */
#[Fillable([
    'quotation_id',
    'delivery_date',
    'remarks',
    'status',
    'delivered_by_id',
    'delivered_at',
])]
class DeliveryOrder extends Model
{
    /** @use HasFactory<DeliveryOrderFactory> */
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
     * Get the statuses this delivery order may transition to from its current status.
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
        static::creating(function (DeliveryOrder $deliveryOrder): void {
            $deliveryOrder->uuid ??= (string) Str::uuid();

            if (! $deliveryOrder->do_code) {
                $quotation = Quotation::query()->with('project.customer')->findOrFail($deliveryOrder->quotation_id);
                $now = now();
                $number = DeliveryOrderCodeSequence::nextNumber((int) $now->format('Y'));

                $deliveryOrder->do_code = sprintf(
                    'LAB-DO%s%03d-%s',
                    $now->format('y'),
                    $number,
                    $quotation->project->customer->customer_code,
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
     * Get the quotation this delivery order was raised against.
     *
     * @return BelongsTo<Quotation, $this>
     */
    public function quotation(): BelongsTo
    {
        return $this->belongsTo(Quotation::class);
    }

    /**
     * Get the workforce member who delivered the goods.
     *
     * @return BelongsTo<Workforce, $this>
     */
    public function deliveredBy(): BelongsTo
    {
        return $this->belongsTo(Workforce::class, 'delivered_by_id');
    }

    /**
     * Get the line items on this delivery order.
     *
     * @return HasMany<DeliveryOrderItem, $this>
     */
    public function items(): HasMany
    {
        return $this->hasMany(DeliveryOrderItem::class);
    }

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'delivery_date' => 'date',
            'delivered_at' => 'datetime',
            'created_at' => 'datetime',
            'updated_at' => 'datetime',
            'deleted_at' => 'datetime',
        ];
    }
}
