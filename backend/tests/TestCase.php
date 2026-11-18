<?php

namespace Tests;

use Illuminate\Foundation\Application;
use Illuminate\Foundation\Testing\TestCase as BaseTestCase;
use LogicException;

abstract class TestCase extends BaseTestCase
{
    public function createApplication(): Application
    {
        $app = parent::createApplication();
        $connection = $app->make('db')->connection();
        $driver = $connection->getDriverName();
        $database = $connection->getDatabaseName();
        $schema = $connection->getConfig('search_path');

        // RefreshDatabase must never migrate an accidentally configured real DB.
        if (! ($driver === 'sqlite' && $database === ':memory:')
            && ! ($driver === 'pgsql' && str_ends_with($database, '_test')
                && is_string($schema) && str_ends_with($schema, '_testing'))) {
            throw new LogicException('Tests require in-memory SQLite or a dedicated *_test PostgreSQL database with a *_testing schema.');
        }

        return $app;
    }
}
