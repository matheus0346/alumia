<?php

namespace App\Providers;

use Illuminate\Cache\RateLimiting\Limit;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Support\ServiceProvider;
use Illuminate\Support\Str;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        //
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        RateLimiter::for('csrf', fn (Request $request) => Limit::perMinute(60)->by($request->ip()));
        RateLimiter::for('institution-login', function (Request $request) {
            $username = $request->input('username');
            $username = is_string($username) ? Str::lower(trim($username)) : '';

            return [
                Limit::perMinute(5)->by('account-ip:'.hash('sha256', $username.'|'.$request->ip())),
                Limit::perMinute(30)->by('ip:'.$request->ip()),
            ];
        });
        RateLimiter::for('student-login', fn (Request $request) => Limit::perMinute(20)->by($request->ip()));
        RateLimiter::for('password-change', fn (Request $request) => Limit::perMinute(5)->by('password:'.(Auth::guard('web')->id() ?? $request->ip())));
    }
}
