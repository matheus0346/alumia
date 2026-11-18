<?php

namespace App\Http\Controllers;

use App\Models\CredentialEvent;
use App\Models\Student;
use App\Models\User;
use App\Rules\PasswordBytes;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;
use Illuminate\Validation\Rules\Password;
use Illuminate\Validation\ValidationException;
use Symfony\Component\HttpFoundation\Response;

class AuthController extends Controller
{
    public function csrf(Request $request): JsonResponse
    {
        return response()->json(['csrf_token' => $request->session()->token()]);
    }

    public function institutionLogin(Request $request): JsonResponse
    {
        $data = $request->validate(['username' => ['required', 'string', 'max:80'], 'password' => ['required', 'string', 'max:72', new PasswordBytes]]);
        $user = User::where('username', Str::lower(trim($data['username'])))->first();
        $validPassword = Hash::check($data['password'], $user?->password ?? config('alumia.dummy_password_hash'));
        if (! $user || ! $validPassword || ! $user->active
            || ($user->role === 'school' && ! $user->school?->active)
            || ($user->role === 'admin' && $user->school_id !== null)) {
            throw ValidationException::withMessages(['credentials' => 'Credenciais inválidas.']);
        }
        $this->clearSession($request);
        Auth::guard('web')->login($user);
        $request->session()->regenerate();
        $request->session()->put('identity_version', $user->credential_version);

        return response()->json(['identity' => $this->identityData($user)]);
    }

    public function studentLogin(Request $request): JsonResponse
    {
        $data = $request->validate(['token' => ['required', 'string', 'size:64', 'regex:/\A[a-f0-9]{64}\z/']]);
        $student = Student::where('token_hash', hash('sha256', $data['token']))->first();
        if (! $student || ! $student->active || ! $student->school?->active) {
            throw ValidationException::withMessages(['credentials' => 'Credenciais inválidas.']);
        }
        $this->clearSession($request);
        Auth::guard('student')->login($student);
        $request->session()->regenerate();
        $request->session()->put('identity_version', $student->token_version);

        return response()->json(['identity' => $this->identityData($student)]);
    }

    public function session(Request $request): JsonResponse
    {
        return response()->json(['identity' => $this->identityData($request->attributes->get('identity'))]);
    }

    public function logout(Request $request): Response
    {
        $this->clearSession($request);

        return response()->noContent();
    }

    public function changePassword(Request $request): Response
    {
        $identity = $request->attributes->get('identity');
        abort_unless($identity instanceof User, 403);
        $data = $request->validate([
            'current_password' => ['required', 'string', 'max:72', new PasswordBytes],
            'password' => ['required', 'string', 'max:72', new PasswordBytes, 'confirmed', 'different:current_password', Password::min(12)],
        ]);
        $user = DB::transaction(function () use ($identity, $data) {
            $user = User::lockForUpdate()->findOrFail($identity->id);
            if (! Hash::check($data['current_password'], $user->password)) {
                throw ValidationException::withMessages(['current_password' => 'Senha atual inválida.']);
            }
            $user->update(['password' => $data['password'], 'must_change_password' => false, 'credential_version' => $user->credential_version + 1]);
            CredentialEvent::create(['actor_user_id' => $user->id, 'target_user_id' => $user->id, 'action' => 'password_changed']);

            return $user;
        });
        $request->session()->put('identity_version', $user->credential_version);
        $request->session()->regenerate();
        $request->session()->regenerateToken();

        return response()->noContent();
    }

    private function clearSession(Request $request): void
    {
        Auth::guard('web')->logout();
        Auth::guard('student')->logout();
        $request->session()->invalidate();
        $request->session()->regenerateToken();
    }

    private function identityData(User|Student $identity): array
    {
        if ($identity instanceof Student) {
            return ['id' => $identity->id, 'type' => 'student', 'code' => $identity->code, 'school_id' => $identity->school_id];
        }

        return ['id' => $identity->id, 'type' => $identity->role, 'username' => $identity->username, 'school_id' => $identity->school_id, 'must_change_password' => $identity->must_change_password];
    }
}
