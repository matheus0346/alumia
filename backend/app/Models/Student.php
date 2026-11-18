<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Foundation\Auth\User as Authenticatable;

class Student extends Authenticatable
{
    protected $fillable = ['school_id', 'code', 'token_hash', 'token_version', 'active'];

    protected $hidden = ['token_hash', 'token_version'];

    protected function casts(): array
    {
        return ['active' => 'boolean', 'token_version' => 'integer'];
    }

    public function school(): BelongsTo
    {
        return $this->belongsTo(School::class);
    }
}
