<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Foundation\Auth\User as Authenticatable;

class User extends Authenticatable
{
    use HasFactory;

    protected $fillable = ['username', 'password', 'role', 'school_id', 'active', 'must_change_password', 'credential_version'];

    protected $hidden = ['password', 'remember_token', 'credential_version'];

    protected function casts(): array
    {
        return ['password' => 'hashed', 'active' => 'boolean', 'must_change_password' => 'boolean', 'credential_version' => 'integer'];
    }

    public function school(): BelongsTo
    {
        return $this->belongsTo(School::class);
    }
}
