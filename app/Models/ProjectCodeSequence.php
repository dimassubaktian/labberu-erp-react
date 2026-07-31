<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\DB;

/**
 * @property int $id
 * @property int $year
 * @property int $last_number
 */
#[Fillable(['year', 'last_number'])]
class ProjectCodeSequence extends Model
{
    /**
     * Generate the next sequential project number for the given year,
     * resetting back to 1 whenever the year changes.
     */
    public static function nextNumber(int $year): int
    {
        return DB::transaction(function () use ($year): int {
            $sequence = static::query()->where('year', $year)->lockForUpdate()->first()
                ?? new self(['year' => $year, 'last_number' => 0]);

            $sequence->last_number++;
            $sequence->save();

            return $sequence->last_number;
        });
    }
}
