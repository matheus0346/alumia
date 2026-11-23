<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class AssessmentSubmission extends Model
{
    public $timestamps = false;

    protected $fillable = ['assessment_period_id', 'student_id', 'body', 'submitted_at'];

    protected function casts(): array
    {
        return ['submitted_at' => 'immutable_datetime'];
    }

    public function period(): BelongsTo
    {
        return $this->belongsTo(AssessmentPeriod::class, 'assessment_period_id');
    }

    public function student(): BelongsTo
    {
        return $this->belongsTo(Student::class);
    }
}
