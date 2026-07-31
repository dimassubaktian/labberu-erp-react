<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\DB;

/**
 * @property int $id
 * @property string $letter
 * @property int $last_number
 */
#[Fillable(['letter', 'last_number'])]
class PartnerCodeSequence extends Model
{
    /**
     * Generate the next partner code (e.g. N001) for the given name, shared
     * across Customers and Vendors so each letter's numbering never collides.
     */
    public static function next(string $name): string
    {
        $letter = mb_strtoupper(mb_substr(trim($name), 0, 1));

        return DB::transaction(function () use ($letter): string {
            $sequence = static::query()->where('letter', $letter)->lockForUpdate()->first()
                ?? new self(['letter' => $letter, 'last_number' => 0]);

            $sequence->last_number++;
            $sequence->save();

            return sprintf('%s%03d', $letter, $sequence->last_number);
        });
    }
}
