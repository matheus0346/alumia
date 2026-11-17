<?php

namespace Tests\Feature;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use RuntimeException;
use Tests\TestCase;

class HealthTest extends TestCase
{
    use RefreshDatabase;

    public function test_readiness_requires_the_initial_tables(): void
    {
        $this->getJson('/api/v1/health')
            ->assertOk()
            ->assertExactJson(['status' => 'ready'])
            ->assertHeader('Cache-Control', 'no-store, private');

        Schema::drop('cache');

        $this->getJson('/api/v1/health')
            ->assertStatus(503)
            ->assertExactJson(['status' => 'not_ready']);
    }

    public function test_database_failure_does_not_expose_connection_details(): void
    {
        DB::shouldReceive('connection')->once()
            ->andThrow(new RuntimeException('postgres://private-user:secret@example.invalid'));

        $this->getJson('/api/v1/health')
            ->assertStatus(503)
            ->assertExactJson(['status' => 'not_ready']);
    }

    public function test_liveness_is_independent_of_database_connectivity(): void
    {
        DB::shouldReceive('connection')->never();

        $this->get('/up')->assertOk();
    }

    public function test_missing_api_routes_do_not_return_a_frontend_page(): void
    {
        $this->getJson('/api/v1/students')->assertNotFound();
    }

    public function test_root_does_not_publish_the_legacy_demo_as_the_pilot(): void
    {
        $this->getJson('/')
            ->assertStatus(503)
            ->assertExactJson(['status' => 'implementation_in_progress']);
    }
}
