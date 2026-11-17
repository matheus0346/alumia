<?php

use Illuminate\Support\Facades\Route;

Route::get('/', function () {
    return response()->json(['status' => 'implementation_in_progress'], 503)
        ->header('Cache-Control', 'no-store');
});
