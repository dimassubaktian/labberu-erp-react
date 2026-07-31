<?php

namespace App\Models;

use Database\Factories\ProductFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Support\Carbon;
use Illuminate\Support\Str;

/**
 * @property int $id
 * @property string $uuid
 * @property string $product_code
 * @property string $name
 * @property string $reference_number
 * @property string $descriptions
 * @property string $brand
 * @property string $unit
 * @property string $type
 * @property string $status
 * @property Carbon|null $created_at
 * @property Carbon|null $updated_at
 * @property Carbon|null $deleted_at
 */
#[Fillable([
    'name',
    'reference_number',
    'descriptions',
    'brand',
    'unit',
    'type',
    'status',
])]
class Product extends Model
{
    /** @use HasFactory<ProductFactory> */
    use HasFactory, SoftDeletes;

    /**
     * Bootstrap the model and its traits.
     */
    protected static function booted(): void
    {
        static::creating(function (Product $product): void {
            $product->uuid ??= (string) Str::uuid();
            $product->product_code ??= static::nextProductCode();
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

    /**
     * Generate the next sequential product code (e.g. LAB-PRODUCT-001).
     */
    protected static function nextProductCode(): string
    {
        $lastCode = static::withTrashed()
            ->orderByDesc('id')
            ->value('product_code');

        $nextNumber = $lastCode
            ? ((int) Str::after($lastCode, 'LAB-PRODUCT-')) + 1
            : 1;

        return sprintf('LAB-PRODUCT-%03d', $nextNumber);
    }
}
