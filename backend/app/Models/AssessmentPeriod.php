<?php

namespace App\Models;

use Carbon\CarbonImmutable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class AssessmentPeriod extends Model
{
    public const TIMEZONE = 'America/Sao_Paulo';

    public const DAYS = 7;

    protected $fillable = ['school_id', 'starts_at', 'ends_at', 'closed_at', 'created_by_user_id'];

    protected $appends = ['status'];

    protected function casts(): array
    {
        return ['starts_at' => 'immutable_datetime', 'ends_at' => 'immutable_datetime', 'closed_at' => 'immutable_datetime'];
    }

    /** Janela de 7 dias a partir da data (Y-m-d) em America/Sao_Paulo: 00:00:00 do 1º dia até 23:59:59 do 7º, em UTC. */
    public static function windowFor(string $date): array
    {
        $start = CarbonImmutable::createFromFormat('Y-m-d', $date, self::TIMEZONE)->startOfDay();
        $end = $start->addDays(self::DAYS - 1)->setTime(23, 59, 59);

        return [$start->utc(), $end->utc()];
    }

    /** Aberto de 00:00:00 do 1º dia até o fim do segundo 23:59:59 do último, desde que não encerrado pelo admin. */
    public function isOpenAt(CarbonImmutable $now): bool
    {
        return $this->closed_at === null && $now >= $this->starts_at && $now < $this->ends_at->addSecond();
    }

    public function statusAt(CarbonImmutable $now): string
    {
        if ($this->closed_at !== null) {
            return 'closed';
        }

        return $now < $this->starts_at ? 'scheduled' : ($this->isOpenAt($now) ? 'open' : 'ended');
    }

    public function getStatusAttribute(): string
    {
        return $this->statusAt(CarbonImmutable::now());
    }

    public function school(): BelongsTo
    {
        return $this->belongsTo(School::class);
    }

    public function submissions(): HasMany
    {
        return $this->hasMany(AssessmentSubmission::class);
    }
}
