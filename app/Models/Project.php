<?php

namespace App\Models;

use App\Http\Controllers\DashboardController;
use Database\Factories\ProjectFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasManyThrough;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

/**
 * @property int $id
 * @property string $uuid
 * @property string $project_code
 * @property string $name
 * @property int $customer_id
 * @property int|null $business_line_id
 * @property Carbon $request_date
 * @property int|null $person_in_charge_id
 * @property string|null $description
 * @property string|null $cancel_reason
 * @property string|null $void_reason
 * @property string $status
 * @property string|null $sales_status
 * @property string|null $po_status
 * @property string|null $billing_status
 * @property string $priority
 * @property int|null $equipment_calibration_max_age_months
 * @property Carbon|null $start_date
 * @property Carbon|null $end_date
 * @property Carbon|null $completed_at
 * @property string|null $estimate_contract_value
 * @property string|null $estimate_cost
 * @property string|null $actual_cost
 * @property string|null $actual_contract_value
 * @property Carbon|null $created_at
 * @property Carbon|null $updated_at
 * @property Carbon|null $deleted_at
 */
#[Fillable([
    'name',
    'customer_id',
    'business_line_id',
    'request_date',
    'person_in_charge_id',
    'description',
    'cancel_reason',
    'void_reason',
    'status',
    'priority',
    'equipment_calibration_max_age_months',
    'start_date',
    'end_date',
    'completed_at',
    'estimate_contract_value',
    'estimate_cost',
    'actual_cost',
    'actual_contract_value',
])]
class Project extends Model
{
    /** @use HasFactory<ProjectFactory> */
    use HasFactory, SoftDeletes;

    /**
     * Bootstrap the model and its traits.
     */
    protected static function booted(): void
    {
        static::creating(function (Project $project): void {
            $project->uuid ??= (string) Str::uuid();

            if (! $project->project_code) {
                $customer = Customer::query()->findOrFail($project->customer_id);
                $now = now();
                $number = ProjectCodeSequence::nextNumber((int) $now->format('Y'));

                $project->project_code = sprintf(
                    'LAB-%s%s%03d-%s',
                    $now->format('y'),
                    $now->format('m'),
                    $number,
                    $customer->customer_code,
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
     * Get the customer this project belongs to.
     *
     * @return BelongsTo<Customer, $this>
     */
    public function customer(): BelongsTo
    {
        return $this->belongsTo(Customer::class);
    }

    /**
     * Get the business line this project belongs to.
     *
     * @return BelongsTo<BusinessLine, $this>
     */
    public function businessLine(): BelongsTo
    {
        return $this->belongsTo(BusinessLine::class);
    }

    /**
     * Get the workforce responsible for this project.
     *
     * @return BelongsTo<Workforce, $this>
     */
    public function personInCharge(): BelongsTo
    {
        return $this->belongsTo(Workforce::class, 'person_in_charge_id');
    }

    /**
     * Get the quotations for this project.
     *
     * @return HasMany<Quotation, $this>
     */
    public function quotations(): HasMany
    {
        return $this->hasMany(Quotation::class);
    }

    /**
     * Get the supporting document attachments for this project.
     *
     * @return HasMany<ProjectAttachment, $this>
     */
    public function attachments(): HasMany
    {
        return $this->hasMany(ProjectAttachment::class)->latest();
    }

    /**
     * Get the equipment currently checked out to this project.
     *
     * @return HasMany<Equipment, $this>
     */
    public function equipment(): HasMany
    {
        return $this->hasMany(Equipment::class, 'current_project_id');
    }

    /**
     * Get the purchase orders raised for this project.
     *
     * @return HasMany<PurchaseOrder, $this>
     */
    public function purchaseOrders(): HasMany
    {
        return $this->hasMany(PurchaseOrder::class);
    }

    /**
     * Get the invoices raised against this project's quotations.
     *
     * @return HasManyThrough<Invoice, Quotation, $this>
     */
    public function invoices(): HasManyThrough
    {
        return $this->hasManyThrough(Invoice::class, Quotation::class);
    }

    /**
     * Get the delivery orders raised against this project's quotations.
     *
     * @return HasManyThrough<DeliveryOrder, Quotation, $this>
     */
    public function deliveryOrders(): HasManyThrough
    {
        return $this->hasManyThrough(DeliveryOrder::class, Quotation::class);
    }

    /**
     * Get the purchase invoices raised against this project's purchase orders.
     *
     * @return HasManyThrough<PurchaseInvoice, PurchaseOrder, $this>
     */
    public function purchaseInvoices(): HasManyThrough
    {
        return $this->hasManyThrough(PurchaseInvoice::class, PurchaseOrder::class);
    }

    /**
     * Determine whether any business document has been raised against this project.
     * Delivery orders and invoices hang off quotations, purchase invoices off purchase
     * orders, so those two relations cover every downstream document.
     */
    public function hasRelatedDocuments(): bool
    {
        return $this->quotations()->exists() || $this->purchaseOrders()->exists();
    }

    /**
     * Recompute and persist the main project status from business events.
     * Cancelled and voided are manual-only and are never overridden here.
     */
    public function recomputeStatus(): void
    {
        if (in_array($this->status, ['cancelled', 'voided'])) {
            return;
        }

        $deliveryProgress = ['signed', 'partially_delivered', 'fully_delivered'];

        $fullyDelivered = $this->quotations()->where('progress', 'fully_delivered')->exists();

        if ($fullyDelivered && $this->billing_status === 'paid') {
            $next = 'completed';
        } elseif ($this->quotations()->whereIn('progress', $deliveryProgress)->exists()) {
            $next = 'in_progress';
        } elseif ($this->quotations()->exists()) {
            $next = 'planning';
        } else {
            return;
        }

        if ($next !== $this->status) {
            $this->update(['status' => $next]);
        }
    }

    /**
     * Recompute and persist sales_status from the project's quotations.
     */
    public function recomputeSalesStatus(): void
    {
        $approved = $this->quotations()->where('status', 'approved')->latest()->first();

        if ($approved) {
            $this->sales_status = match ($approved->progress) {
                'signed' => 'signed',
                'sent' => 'sent',
                default => 'approved',
            };
        } elseif ($this->quotations()->exists()) {
            $this->sales_status = 'quoting';
        } else {
            $this->sales_status = null;
        }

        $this->saveQuietly();
    }

    /**
     * Recompute and persist actual_contract_value from the approved quotation.
     * Pass null to clear it (e.g. when the quotation is voided).
     *
     * Actual cost is not derived from the quotation's BOM — that is planned cost. Real spend
     * comes from the vendor's purchase invoices, see {@see self::recomputeActualCost()}.
     */
    public function recomputeActualValues(?Quotation $approvedQuotation = null): void
    {
        // Converted to the base currency with the quotation's snapshotted rate so it can be
        // compared against actual_cost, which is stored the same way.
        $this->actual_contract_value = $approvedQuotation === null
            ? null
            : (string) ((float) $approvedQuotation->total * (float) $approvedQuotation->exchange_rate);

        $this->saveQuietly();
    }

    /**
     * Recompute and persist actual_cost as what vendors have actually billed against this
     * project's purchase orders.
     *
     * Only issued purchase invoices count, taken net of discount and excluding tax (input VAT
     * is reclaimable, so it is not a cost), and converted to the base currency with the rate
     * snapshotted on each purchase order. Stays null while nothing has been invoiced yet.
     */
    public function recomputeActualCost(): void
    {
        $billed = PurchaseInvoice::query()
            ->join('purchase_orders', 'purchase_orders.id', '=', 'purchase_invoices.purchase_order_id')
            ->where('purchase_orders.project_id', $this->id)
            ->whereNull('purchase_orders.deleted_at')
            ->where('purchase_invoices.status', 'issued')
            ->sum(DB::raw('(purchase_invoices.subtotal - purchase_invoices.discount_amount) * purchase_orders.exchange_rate'));

        $this->actual_cost = $billed > 0 ? (string) $billed : null;

        $this->saveQuietly();
    }

    /**
     * Recompute and persist po_status from the project's purchase order progress values.
     */
    public function recomputePoStatus(): void
    {
        $progresses = $this->purchaseOrders()->whereNotNull('progress')->pluck('progress');

        if ($progresses->isEmpty()) {
            $this->po_status = $this->purchaseOrders()->exists() ? 'pending' : null;
        } elseif ($progresses->every(fn ($p) => $p === 'closed')) {
            $this->po_status = 'closed';
        } elseif ($progresses->every(fn ($p) => in_array($p, ['fully_received', 'closed']))) {
            $this->po_status = 'fully_received';
        } elseif ($progresses->contains('partially_received')) {
            $this->po_status = 'partially_received';
        } elseif ($progresses->contains('sent')) {
            $this->po_status = 'sent';
        } else {
            $this->po_status = 'pending';
        }

        $this->saveQuietly();
    }

    /**
     * Recompute and persist billing_status from the project's issued invoices.
     */
    public function recomputeBillingStatus(): void
    {
        $issued = $this->invoices()->where('invoices.status', 'issued')->pluck('invoices.payment_status');

        if ($issued->isEmpty()) {
            $this->billing_status = null;
        } elseif ($issued->every(fn ($s) => $s === 'paid')) {
            $this->billing_status = 'paid';
        } elseif ($issued->contains(fn ($s) => $s === 'partially_paid')) {
            $this->billing_status = 'partially_paid';
        } else {
            $this->billing_status = 'awaiting_payment';
        }

        $this->saveQuietly();
    }

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'request_date' => 'date',
            'start_date' => 'date',
            'end_date' => 'date',
            'completed_at' => 'datetime',
            'estimate_contract_value' => 'decimal:2',
            'estimate_cost' => 'decimal:2',
            'actual_cost' => 'decimal:2',
            'actual_contract_value' => 'decimal:2',
            'created_at' => 'datetime',
            'updated_at' => 'datetime',
            'deleted_at' => 'datetime',
        ];
    }
}
