<?php

namespace Tests\Feature;

use App\Models\School;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Tests\TestCase;

class DatabaseFoundationTest extends TestCase
{
    use RefreshDatabase;

    public function test_initial_database_has_no_demo_accounts_or_schools(): void
    {
        $this->seed();

        $this->assertDatabaseCount('schools', 0);
        $this->assertDatabaseCount('users', 0);
        $this->assertFalse(Schema::hasTable('students'));
    }

    public function test_school_survives_reloading_from_database(): void
    {
        $school = School::create(['name' => 'Escola de teste sintética']);

        $this->assertTrue($school->fresh()->active);
        $school->update(['active' => false]);
        $this->assertFalse(School::findOrFail($school->id)->active);
    }

    public function test_postgres_uses_the_configured_private_schema(): void
    {
        if (DB::getDriverName() !== 'pgsql') {
            $this->markTestSkipped('Executed by the PostgreSQL integration job.');
        }

        $schema = config('database.connections.pgsql.search_path');
        $this->assertNotSame('public', $schema);
        $this->assertSame($schema, DB::selectOne('select current_schema() as schema')->schema);
        $this->assertNotNull(DB::selectOne('select to_regclass(?) as table_name', [$schema.'.schools'])->table_name);
        $this->assertNull(DB::selectOne("select to_regclass('public.schools') as table_name")->table_name);
    }
}
