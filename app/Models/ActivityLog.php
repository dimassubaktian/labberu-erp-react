<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\MorphTo;
use Illuminate\Support\Carbon;

/**
 * @property int $id
 * @property int|null $causer_id
 * @property string $subject_type
 * @property int $subject_id
 * @property string $action
 * @property string $description
 * @property Carbon $created_at
 */
#[Fillable([
    'causer_id',
    'subject_type',
    'subject_id',
    'action',
    'description',
])]
class ActivityLog extends Model
{
    const UPDATED_AT = null;

    /**
     * Record an activity log entry against the given subject, attributed to the current user.
     */
    public static function record(string $action, Model $subject, string $description): void
    {
        static::create([
            'causer_id' => auth()->id(),
            'subject_type' => $subject->getMorphClass(),
            'subject_id' => $subject->getKey(),
            'action' => $action,
            'description' => $description,
        ]);
    }

    /**
     * Get the user who caused this activity, if any.
     *
     * @return BelongsTo<User, $this>
     */
    public function causer(): BelongsTo
    {
        return $this->belongsTo(User::class, 'causer_id');
    }

    /**
     * Get the model this activity was recorded against.
     *
     * @return MorphTo<Model, $this>
     */
    public function subject(): MorphTo
    {
        return $this->morphTo();
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
        ];
    }
}
