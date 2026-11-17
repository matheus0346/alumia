<?php

use App\Models\Student;
use App\Models\User;

return [
    'defaults' => ['guard' => 'web'],
    'guards' => [
        'web' => ['driver' => 'session', 'provider' => 'users'],
        'student' => ['driver' => 'session', 'provider' => 'students'],
    ],
    'providers' => [
        'users' => ['driver' => 'eloquent', 'model' => User::class],
        'students' => ['driver' => 'eloquent', 'model' => Student::class],
    ],
    // No public password reset broker for institutional credentials.
    'passwords' => [],
    'password_timeout' => 10800,
];
