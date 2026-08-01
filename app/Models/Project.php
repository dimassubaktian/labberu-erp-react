<?php

namespace App\Models;

use Database\Factories\ProjectFactory;
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
 * @property string $project_code
 * @property string $name
 * @property int $customer_id
 * @property Carbon $request_date
 * @property int|null $person_in_charge_id
 * @property string|null $description
 * @property string $status
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
