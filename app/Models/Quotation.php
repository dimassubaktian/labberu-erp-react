<?php

namespace App\Models;

use Database\Factories\QuotationFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Support\Carbon;
use Illuminate\Support\Str;

/**
 * @property int $id
 * @property string $uuid
 * @property string $quotation_code
 * @property int $project_id
 * @property int $thread_number
 * @property int|null $root_quotation_id
 * @property int $version_major
 * @property int $version_minor
 * @property bool $is_current
 * @property string $status
 * @property int $currency_id
 * @property Carbon|null $valid_until
 * @property string|null $discount_type
 * @property string|null $discount_value
 * @property int|null $tax_id
 * @property string $subtotal
 * @property string $discount_amount
 * @property string $tax_amount
 * @property string $total
 * @property string|null $remarks
 * @property int|null $approved_by
 * @property Carbon|null $approved_at
 * @property Carbon|null $created_at
 * @property Carbon|null $updated_at
 * @property Carbon|null $deleted_at
 */
#[Fillable([
    'project_id',
    'root_quotation_id',
    'version_major',
    'version_minor',
    'is_current',
    'status',
    'currency_id',
    'valid_until',
    'discount_type',
    'discount_value',
    'tax_id',
    'subtotal',
    'discount_amount',
    'tax_amount',
    'total',
    'remarks',
    'approved_by',
    'approved_at',
])]
class Quotation extends Model
{
    /** @use HasFactory<QuotationFactory> */
    use HasFactory, SoftDeletes;

    /**
     * Map of each status to the statuses it may transition to.
     *
     * @var array<string, array<int, string>>
     */
    private const array TRANSITIONS = [
        'draft' => ['request_for_approval', 'cancelled'],
        'request_for_approval' => ['approved', 'rejected', 'cancelled'],
        'approved' => ['voided'],
        'rejected' => [],
        'voided' => [],
        'cancelled' => [],
    ];

    /**
     * Get the statuses this quotation may transition to from its current status.
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
        static::creating(function (Quotation $quotation): void {
            $quotation->uuid ??= (string) Str::uuid();

            if ($quotation->root_quotation_id) {
                $root = static::withTrashed()->findOrFail($quotation->root_quotation_id);
                $quotation->thread_number = $root->thread_number;
                $quotation->quotation_code ??= $root->quotation_code;

                return;
            }

            if (! $quotation->quotation_code) {
                $project = Project::query()->findOrFail($quotation->project_id);
                [$prefix, $sequence, $customerCode] = explode('-', $project->project_code);

                $quotation->thread_number = static::withTrashed()
                    ->where('project_id', $quotation->project_id)
                    ->max('thread_number') + 1;

                $quotation->quotation_code = sprintf(
                    '%s-Q%s-%02d-%s',
                    $prefix,
                    $sequence,
                    $quotation->thread_number,
                    $customerCode,
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
     * Get the project this quotation belongs to.
     *
     * @return BelongsTo<Project, $this>
     */
    public function project(): BelongsTo
    {
        return $this->belongsTo(Project::class);
    }

    /**
     * Get the currency this quotation is priced in.
     *
     * @return BelongsTo<Currency, $this>
     */
    public function currency(): BelongsTo
    {
        return $this->belongsTo(Currency::class);
    }

    /**
     * Get the tax applied to this quotation.
     *
     * @return BelongsTo<Tax, $this>
     */
    public function tax(): BelongsTo
    {
        return $this->belongsTo(Tax::class);
    }

    /**
     * Get the user who approved this quotation.
     *
     * @return BelongsTo<User, $this>
     */
    public function approver(): BelongsTo
    {
        return $this->belongsTo(User::class, 'approved_by');
    }

    /**
     * Get the root (first version) of this quotation's thread.
     *
     * @return BelongsTo<Quotation, $this>
     */
    public function root(): BelongsTo
    {
        return $this->belongsTo(Quotation::class, 'root_quotation_id');
    }

    /**
     * Get the line items on this quotation.
     *
     * @return HasMany<QuotationItem, $this>
     */
    public function items(): HasMany
    {
        return $this->hasMany(QuotationItem::class);
    }

    /**
     * Get the item groups on this quotation.
     *
     * @return HasMany<QuotationGroup, $this>
     */
    public function groups(): HasMany
    {
        return $this->hasMany(QuotationGroup::class)->orderBy('sort_order');
    }

    /**
     * Get the bill of materials for this quotation.
     *
     * @return HasOne<Bom, $this>
     */
    public function bom(): HasOne
    {
        return $this->hasOne(Bom::class);
    }

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'is_current' => 'boolean',
            'valid_until' => 'date',
            'discount_value' => 'decimal:2',
            'subtotal' => 'decimal:2',
            'discount_amount' => 'decimal:2',
            'tax_amount' => 'decimal:2',
            'total' => 'decimal:2',
            'approved_at' => 'datetime',
            'created_at' => 'datetime',
            'updated_at' => 'datetime',
            'deleted_at' => 'datetime',
        ];
    }
}
