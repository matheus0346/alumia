<?php

namespace App\Http\Controllers;

use App\Models\AssessmentPeriod;
use App\Models\AssessmentSubmission;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

/** A escola lê somente períodos e textos da própria instituição. */
class SchoolAssessmentController extends Controller
{
    public function periods(Request $request): JsonResponse
    {
        $periods = AssessmentPeriod::where('school_id', $request->attributes->get('identity')->school_id)
            ->withCount('submissions')->orderByDesc('starts_at')->paginate(30);

        return response()->json(['periods' => $periods]);
    }

    public function submissions(Request $request, string $period): JsonResponse
    {
        $record = AssessmentPeriod::where('school_id', $request->attributes->get('identity')->school_id)->findOrFail($period);
        $submissions = AssessmentSubmission::where('assessment_period_id', $record->id)->join('students', 'students.id', '=', 'assessment_submissions.student_id')
            ->orderBy('assessment_submissions.id')
            ->select(['assessment_submissions.id', 'students.code as student_code', 'assessment_submissions.body as text', 'assessment_submissions.submitted_at'])->paginate(20);

        return response()->json(['period' => $record, 'submissions' => $submissions]);
    }
}
