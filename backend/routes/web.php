<?php

use Illuminate\Support\Facades\Route;

require __DIR__.'/auth.php';

Route::get('/', function () {
    return response()->json(['status' => 'implementation_in_progress'], 503)
        ->header('Cache-Control', 'no-store');
});
