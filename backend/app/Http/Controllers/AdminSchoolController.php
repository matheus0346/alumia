<?php

namespace App\Http\Controllers;

use App\Models\CredentialEvent;
use App\Models\School;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class AdminSchoolController extends Controller
{
    public function index(): JsonResponse
    {
        return response()->json(['schools' => School::orderBy('id')->paginate(30)]);
    }

    public function store(Request $request): JsonResponse
    {
        if (is_string($request->input('username'))) {
            $request->merge(['username' => Str::lower(trim($request->input('username')))]);
        }
        $data = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'username' => ['required', 'string', 'min:3', 'max:80', 'regex:/\A[a-z0-9_.-]+\z/', 'unique:users,username'],
        ]);
        $temporaryPassword = Str::password(24);
        $school = DB::transaction(function () use ($data, $temporaryPassword, $request) {
            $school = School::create(['name' => $data['name']]);
            $user = User::create(['username' => $data['username'], 'password' => $temporaryPassword, 'role' => 'school', 'school_id' => $school->id, 'must_change_password' => true]);
            CredentialEvent::create(['actor_user_id' => $request->attributes->get('identity')->id, 'target_user_id' => $user->id, 'action' => 'school_created']);

            return $school;
        });

        return response()->json(['school' => $school, 'username' => $data['username'], 'temporary_password' => $temporaryPassword], 201);
    }

    public function resetPassword(Request $request, string $school): JsonResponse
    {
        $temporaryPassword = Str::password(24);
        $user = DB::transaction(function () use ($school, $temporaryPassword, $request) {
            $user = User::where('school_id', $school)->where('role', 'school')->lockForUpdate()->firstOrFail();
            $user->update(['password' => $temporaryPassword, 'must_change_password' => true, 'credential_version' => $user->credential_version + 1, 'remember_token' => null]);
            CredentialEvent::create(['actor_user_id' => $request->attributes->get('identity')->id, 'target_user_id' => $user->id, 'action' => 'password_reset']);

            return $user;
        });

        return response()->json(['username' => $user->username, 'temporary_password' => $temporaryPassword]);
    }

    public function update(Request $request, string $school): JsonResponse
    {
        $data = $request->validate(['active' => ['required', 'boolean']]);
        $record = School::findOrFail($school);
        $record->update($data);

        return response()->json(['school' => $record]);
    }
}
