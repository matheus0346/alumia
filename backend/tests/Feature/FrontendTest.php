<?php

namespace Tests\Feature;

use Illuminate\Support\Facades\File;
use Tests\TestCase;

class FrontendTest extends TestCase
{
    public function test_only_a_pilot_build_is_served(): void
    {
        $directory = storage_path('framework/testing/frontend-'.bin2hex(random_bytes(8)));
        File::ensureDirectoryExists($directory);
        config(['frontend.path' => $directory]);
        try {
            File::put($directory.'/index.html', '<html><body>React pilot</body></html>');
            foreach (['{"mode":"demo"}', 'invalid json'] as $marker) {
                File::put($directory.'/build-mode.json', $marker);
                $this->get('/')->assertStatus(503);
            }
            File::put($directory.'/build-mode.json', '{"mode":"pilot"}');
            $this->get('/')->assertOk()->assertSee('React pilot')->assertHeader('Cache-Control', 'no-store, private');
            $this->getJson('/api/v1/missing')->assertNotFound();
        } finally {
            File::deleteDirectory($directory);
        }
    }
}
