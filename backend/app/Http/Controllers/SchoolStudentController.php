<?php

namespace App\Http\Controllers;

use App\Models\CredentialEvent;
use App\Models\Student;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;

class SchoolStudentController extends Controller
{
    public function school(Request $request): JsonResponse
    {
        return response()->json(['school' => $request->attributes->get('identity')->school]);
    }

    public function index(Request $request): JsonResponse
    {
        $students = Student::where('school_id', $request->attributes->get('identity')->school_id)
            ->select(['id', 'code', 'active', 'created_at'])->orderBy('id')->paginate(30);

        return response()->json(['students' => $students]);
    }

    public function store(Request $request): JsonResponse
    {
        $user = $request->attributes->get('identity');
        if (is_string($request->input('code'))) {
            $request->merge(['code' => Str::upper(trim($request->input('code')))]);
        }
        $data = $request->validate(['code' => ['required', 'string', 'max:40', 'regex:/\A[A-Z0-9_-]+\z/', Rule::unique('students')->where('school_id', $user->school_id)]]);
        $token = bin2hex(random_bytes(32));
        $student = DB::transaction(function () use ($data, $user, $token) {
            $student = Student::create(['school_id' => $user->school_id, 'code' => $data['code'], 'token_hash' => hash('sha256', $token)]);
            CredentialEvent::create(['actor_user_id' => $user->id, 'target_student_id' => $student->id, 'action' => 'student_created']);

            return $student;
        });

        return response()->json(['student' => $student, 'token' => $token], 201);
    }

    public function rotateToken(Request $request, string $student): JsonResponse
    {
        $user = $request->attributes->get('identity');
        $token = bin2hex(random_bytes(32));
        $record = DB::transaction(function () use ($student, $user, $token) {
            $record = Student::where('school_id', $user->school_id)->lockForUpdate()->findOrFail($student);
            $record->update(['token_hash' => hash('sha256', $token), 'token_version' => $record->token_version + 1, 'active' => true]);
            CredentialEvent::create(['actor_user_id' => $user->id, 'target_student_id' => $record->id, 'action' => 'student_token_rotated']);

            return $record;
        });

        return response()->json(['student' => $record, 'token' => $token]);
    }

    public function revokeToken(Request $request, string $student): JsonResponse
    {
        $user = $request->attributes->get('identity');
        $record = DB::transaction(function () use ($student, $user) {
            $record = Student::where('school_id', $user->school_id)->lockForUpdate()->findOrFail($student);
            $record->update(['active' => false, 'token_version' => $record->token_version + 1]);
            CredentialEvent::create(['actor_user_id' => $user->id, 'target_student_id' => $record->id, 'action' => 'student_token_revoked']);

            return $record;
        });

        return response()->json(['student' => $record]);
    }
}
