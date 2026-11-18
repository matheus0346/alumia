<?php

use App\Http\Controllers\FrontendController;
use Illuminate\Support\Facades\Route;

require __DIR__.'/auth.php';

Route::get('/', FrontendController::class);
