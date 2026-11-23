<?php

namespace App\Http\Controllers;

use App\Models\AssessmentPeriod;
use App\Models\AssessmentSubmission;
use Carbon\CarbonImmutable;
use Illuminate\Database\UniqueConstraintViolationException;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Throwable;

class StudentAssessmentController extends Controller
{
    public const MAX_LENGTH = 5000;

    /** Período aberto da escola do estudante (ou null) e se ele já enviou. */
    public function current(Request $request): JsonResponse
    {
        $student = $request->attributes->get('identity');
        $now = CarbonImmutable::now();
        $period = AssessmentPeriod::where('school_id', $student->school_id)->whereNull('closed_at')
            ->where('starts_at', '<=', $now)->where('ends_at', '>=', $now->subSecond())->orderByDesc('starts_at')->first();
        $period = $period?->isOpenAt($now) ? $period : null;
        $submission = $period ? AssessmentSubmission::where('assessment_period_id', $period->id)->where('student_id', $student->id)->first(['id', 'submitted_at']) : null;

        return response()->json([
            'period' => $period?->only(['id', 'starts_at', 'ends_at']),
            'submitted' => $submission !== null,
            'submitted_at' => $submission?->submitted_at,
            'max_length' => self::MAX_LENGTH,
        ]);
    }

    public function submit(Request $request, string $period): JsonResponse
    {
        $student = $request->attributes->get('identity');
        // Período de outra escola é indistinguível de inexistente.
        AssessmentPeriod::where('school_id', $student->school_id)->findOrFail($period);
        $data = $request->validate(['text' => ['required', 'string', 'max:'.self::MAX_LENGTH, 'regex:/\S/u']]);
        try {
            // A trava no período disputa com o encerramento (close() também trava a linha): ou o envio
            // é gravado antes de o encerramento confirmar, ou vê o período fechado. O resultado é
            // devolvido pela transação e tratado fora, para o catch abaixo não engolir os 409.
            $result = DB::transaction(function () use ($student, $period, $data) {
                $record = AssessmentPeriod::where('school_id', $student->school_id)->lockForUpdate()->findOrFail($period);
                $now = CarbonImmutable::now(); // lido depois da trava
                if (! $record->isOpenAt($now)) {
                    return 'period_closed';
                }
                if (AssessmentSubmission::where('assessment_period_id', $record->id)->where('student_id', $student->id)->exists()) {
                    return 'already_submitted';
                }

                return AssessmentSubmission::create(['assessment_period_id' => $record->id, 'student_id' => $student->id, 'body' => $data['text'], 'submitted_at' => $now]);
            });
        } catch (UniqueConstraintViolationException) {
            return response()->json(['error' => 'already_submitted'], 409);
        } catch (Throwable) {
            // Sem relatar a exceção: a mensagem do banco poderia conter o texto do estudante.
            Log::warning('assessment_submission_failed', ['period_id' => (int) $period, 'student_id' => $student->id]);

            return response()->json(['error' => 'save_failed'], 503);
        }
        if (is_string($result)) {
            return response()->json(['error' => $result], 409);
        }

        return response()->json(['submitted' => true, 'submitted_at' => $result->submitted_at], 201);
    }
}
