<?php

namespace App\Http\Controllers;

use Illuminate\Http\Response;

class FrontendController extends Controller
{
    public function __invoke(): Response
    {
        $directory = config('frontend.path');
        $marker = is_file($directory.'/build-mode.json')
            ? json_decode(file_get_contents($directory.'/build-mode.json'), true) : null;
        if (($marker['mode'] ?? null) !== 'pilot' || ! is_file($directory.'/index.html')) {
            return response(['status' => 'frontend_not_built'], 503)->header('Cache-Control', 'no-store');
        }

        return response(file_get_contents($directory.'/index.html'))
            ->header('Content-Type', 'text/html; charset=UTF-8')
            ->header('Cache-Control', 'no-store');
    }
}
