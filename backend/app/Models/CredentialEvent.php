<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class CredentialEvent extends Model
{
    public $timestamps = false;

    protected $fillable = ['actor_user_id', 'target_user_id', 'target_student_id', 'action'];
}
