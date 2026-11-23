<?php

namespace App\Http\Controllers;

use App\Models\AssessmentPeriod;
use App\Models\School;
use Carbon\CarbonImmutable;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

/** Somente o administrador geral abre e encerra períodos. Não há rota para ele ler textos (DEC-05). */
class AdminAssessmentPeriodController extends Controller
{
    public function index(string $school): JsonResponse
    {
        School::findOrFail($school);
        // Apenas contagem de envios; nunca o conteúdo.
        $periods = AssessmentPeriod::where('school_id', $school)->withCount('submissions')->orderByDesc('starts_at')->paginate(30);

        return response()->json(['periods' => $periods]);
    }

    public function store(Request $request, string $school): JsonResponse
    {
        $data = $request->validate(['start_date' => ['required', 'string', 'date_format:Y-m-d']]);
        $admin = $request->attributes->get('identity');
        [$start, $end] = AssessmentPeriod::windowFor($data['start_date']);
        if ($start < CarbonImmutable::now(AssessmentPeriod::TIMEZONE)->startOfDay()->utc()) {
            throw ValidationException::withMessages(['start_date' => 'A data de início não pode ser anterior a hoje.']);
        }
        $period = DB::transaction(function () use ($school, $start, $end, $admin) {
            $record = School::lockForUpdate()->findOrFail($school);
            $overlap = AssessmentPeriod::where('school_id', $record->id)->whereNull('closed_at')
                ->where('starts_at', '<=', $end)->where('ends_at', '>=', $start)->exists();
            if ($overlap) {
                throw ValidationException::withMessages(['start_date' => 'Já existe um período aberto ou agendado que se sobrepõe a estas datas. Encerre-o antes.']);
            }

            return AssessmentPeriod::create(['school_id' => $record->id, 'starts_at' => $start, 'ends_at' => $end, 'created_by_user_id' => $admin->id]);
        });

        return response()->json(['period' => $period], 201);
    }

    public function close(string $period): JsonResponse
    {
        $record = DB::transaction(function () use ($period) {
            $record = AssessmentPeriod::lockForUpdate()->findOrFail($period);
            if ($record->closed_at === null) {
                $record->update(['closed_at' => CarbonImmutable::now()]);
            }

            return $record;
        });

        return response()->json(['period' => $record]);
    }
}
