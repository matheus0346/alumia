<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Throwable;

class CheckDatabase extends Command
{
    protected $signature = 'alumia:database:check {--schema-only : Verifica conexão e schema antes das migrações}';

    protected $description = 'Verifica PostgreSQL sem exibir credenciais nem alterar dados.';

    public function handle(): int
    {
        try {
            if (DB::getDriverName() !== 'pgsql') {
                $this->error('Selecione uma conexão PostgreSQL.');

                return self::FAILURE;
            }
            $configured = config('database.connections.pgsql.search_path');
            $actual = DB::selectOne('select current_schema() as schema')->schema;
            if (! is_string($configured) || $configured === 'public' || $actual !== $configured) {
                $this->error('O schema privado configurado não está disponível nesta conexão.');

                return self::FAILURE;
            }
            if (! $this->option('schema-only')) {
                foreach (['schools', 'users', 'students', 'credential_events', 'sessions', 'cache', 'cache_locks'] as $table) {
                    if (! Schema::hasTable($table)) {
                        $this->error('Existem migrações pendentes. Confirme o destino antes de executá-las.');

                        return self::FAILURE;
                    }
                }
            }
        } catch (Throwable) {
            $this->error('Não foi possível verificar a conexão. Confira localmente os parâmetros, TLS e disponibilidade do banco.');

            return self::FAILURE;
        }
        $this->info('Conexão PostgreSQL e schema privado verificados.');

        return self::SUCCESS;
    }
}
