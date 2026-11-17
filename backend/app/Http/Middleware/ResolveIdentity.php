<?php

namespace App\Http\Middleware;

use App\Models\Student;
use App\Models\User;
use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Symfony\Component\HttpFoundation\Response;

class ResolveIdentity
{
    public function handle(Request $request, Closure $next): Response
    {
        $user = Auth::guard('web')->user()?->fresh();
        $student = Auth::guard('student')->user()?->fresh();
        $identity = $user ?? $student;
        if (! $identity || ($user && $student)) {
            return response()->json(['error' => 'unauthenticated'], 401);
        }
        $expected = $identity instanceof User ? $identity->credential_version : $identity->token_version;
        if ($request->session()->get('identity_version') !== $expected) {
            Auth::guard('web')->logout();
            Auth::guard('student')->logout();
            $request->session()->invalidate();
            $request->session()->regenerateToken();

            return response()->json(['error' => 'session_revoked'], 401);
        }
        $needsSchool = $identity instanceof Student || $identity->role === 'school';
        if (! $identity->active || ($needsSchool && ! $identity->school?->active)
            || ($identity instanceof User && $identity->role === 'admin' && $identity->school_id !== null)) {
            return response()->json(['error' => 'access_suspended'], 403);
        }
        $request->attributes->set('identity', $identity);

        return $next($request);
    }
}
