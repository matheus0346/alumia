<?php

namespace App\Http\Middleware;

use App\Models\User;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class RequireInstitutionRole
{
    public function handle(Request $request, Closure $next, string $role): Response
    {
        $identity = $request->attributes->get('identity');
        if (! $identity instanceof User || $identity->role !== $role) {
            return response()->json(['error' => 'forbidden'], 403);
        }
        if ($identity->must_change_password) {
            return response()->json(['error' => 'password_change_required'], 403);
        }

        return $next($request);
    }
}
