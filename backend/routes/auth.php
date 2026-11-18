<?php

use App\Http\Controllers\AdminSchoolController;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\SchoolStudentController;
use App\Http\Middleware\PrivateApiResponse;
use App\Http\Middleware\RequireInstitutionRole;
use App\Http\Middleware\ResolveIdentity;
use Illuminate\Support\Facades\Route;

// Loaded from web.php: cookie sessions and CSRF apply to every mutation.
Route::prefix('api/v1')->middleware(PrivateApiResponse::class)->group(function () {
    Route::get('auth/csrf', [AuthController::class, 'csrf'])->middleware('throttle:csrf');
    Route::post('auth/institution/login', [AuthController::class, 'institutionLogin'])->middleware('throttle:institution-login');
    Route::post('auth/student/login', [AuthController::class, 'studentLogin'])->middleware('throttle:student-login');
    Route::post('auth/logout', [AuthController::class, 'logout']);

    Route::middleware(ResolveIdentity::class)->group(function () {
        Route::get('auth/session', [AuthController::class, 'session']);
        Route::put('auth/password', [AuthController::class, 'changePassword'])->middleware('throttle:password-change');
        Route::prefix('admin')->middleware(RequireInstitutionRole::class.':admin')->group(function () {
            Route::get('schools', [AdminSchoolController::class, 'index']);
            Route::post('schools', [AdminSchoolController::class, 'store']);
            Route::post('schools/{school}/password', [AdminSchoolController::class, 'resetPassword'])->whereNumber('school');
            Route::patch('schools/{school}', [AdminSchoolController::class, 'update'])->whereNumber('school');
        });
        Route::middleware(RequireInstitutionRole::class.':school')->group(function () {
            Route::get('school', [SchoolStudentController::class, 'school']);
            Route::get('school/students', [SchoolStudentController::class, 'index']);
            Route::post('school/students', [SchoolStudentController::class, 'store']);
            Route::post('school/students/{student}/token', [SchoolStudentController::class, 'rotateToken'])->whereNumber('student');
            Route::delete('school/students/{student}/token', [SchoolStudentController::class, 'revokeToken'])->whereNumber('student');
        });
    });
});
