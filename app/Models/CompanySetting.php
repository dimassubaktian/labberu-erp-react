<?php

namespace App\Models;

use Database\Factories\CompanySettingFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Casts\Attribute;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

/**
 * @property int $id
 * @property string $uuid
 * @property string $legal_name
 * @property string|null $trade_name
 * @property string|null $tax_id
 * @property string|null $business_registration_number
 * @property string|null $email
 * @property string|null $phone
 * @property string|null $website
 * @property string|null $address
 * @property string|null $city
 * @property string|null $province
 * @property string|null $postal_code
 * @property string|null $country
 * @property string|null $logo
 * @property-read string|null $logo_url
 * @property Carbon|null $created_at
 * @property Carbon|null $updated_at
 * @property Carbon|null $deleted_at
 */
#[Fillable([
    'legal_name',
    'trade_name',
    'tax_id',
    'business_registration_number',
    'email',
    'phone',
    'website',
    'address',
    'city',
    'province',
    'postal_code',
    'country',
    'logo',
])]
class CompanySetting extends Model
{
    /** @use HasFactory<CompanySettingFactory> */
    use HasFactory, SoftDeletes;

    /**
     * The accessors to append to the model's array form.
     *
     * @var list<string>
     */
    protected $appends = ['logo_url'];

    /**
     * Bootstrap the model and its traits.
     */
    protected static function booted(): void
    {
        static::creating(function (CompanySetting $companySetting): void {
            $companySetting->uuid ??= (string) Str::uuid();
        });
    }

    /**
     * Get the publicly accessible URL for the company logo.
     *
     * @return Attribute<string|null, mixed>
     */
    protected function logoUrl(): Attribute
    {
        return Attribute::make(get: fn (): ?string => $this->logo ? Storage::disk('public')->url($this->logo) : null);
    }

    /**
     * Get the single company settings record, or an empty unsaved instance if none exists yet.
     */
    public static function current(): self
    {
        return static::first() ?? new self(array_fill_keys((new self())->getFillable(), null));
    }

    /**
     * Get the route key for the model.
     */
    public function getRouteKeyName(): string
    {
        return 'uuid';
    }

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'created_at' => 'datetime',
            'updated_at' => 'datetime',
            'deleted_at' => 'datetime',
        ];
    }
}
