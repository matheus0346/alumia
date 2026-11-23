<?php

namespace App\Http\Controllers;

use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Throwable;

class HealthController extends Controller
{
    public function __invoke(): JsonResponse
    {
        try {
            DB::connection()->select('select 1');
            $ready = Schema::hasTable('schools')
                && Schema::hasTable('users')
                && Schema::hasTable('students')
                && Schema::hasTable('assessment_periods')
                && Schema::hasTable('assessment_submissions')
                && Schema::hasTable('credential_events')
                && Schema::hasTable('sessions')
                && Schema::hasTable('cache')
                && Schema::hasTable('cache_locks');
        } catch (Throwable) {
            // Do not leak a connection string, SQL, credentials or provider errors.
            $ready = false;
        }

        return response()->json(
            ['status' => $ready ? 'ready' : 'not_ready'],
            $ready ? 200 : 503,
            ['Cache-Control' => 'no-store'],
        );
    }
}
