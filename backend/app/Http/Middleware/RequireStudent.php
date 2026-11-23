<?php

namespace App\Http\Middleware;

use App\Models\Student;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class RequireStudent
{
    public function handle(Request $request, Closure $next): Response
    {
        if (! $request->attributes->get('identity') instanceof Student) {
            return response()->json(['error' => 'forbidden'], 403);
        }

        return $next($request);
    }
}
