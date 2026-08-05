<?php

namespace App\Models;

use Database\Factories\ProjectFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasManyThrough;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Support\Carbon;
use Illuminate\Support\Str;

/**
 * @property int $id
 * @property string $uuid
 * @property string $project_code
 * @property string $name
 * @property int $customer_id
 * @property Carbon $request_date
 * @property int|null $person_in_charge_id
 * @property string|null $description
 * @property string $status
 * @property string|null $sales_status
 * @property string|null $po_status
 * @property string|null $billing_status
 * @property string $priority
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
    'request_date',
    'person_in_charge_id',
    'description',
    'status',
    'priority',
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
     * Recompute and persist the main project status from business events.
     * Cancelled is manual-only and is never overridden here.
     */
    public function recomputeStatus(): void
    {
        if ($this->status === 'cancelled') {
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
