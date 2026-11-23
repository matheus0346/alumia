<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

// Aditiva: só cria tabelas novas; não altera nem lê dados existentes.
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('assessment_periods', function (Blueprint $table) {
            $table->id();
            $table->foreignId('school_id')->constrained()->restrictOnDelete();
            // Instantes em UTC. A janela é calculada em America/Sao_Paulo (00:00:00 do 1º dia a 23:59:59 do último).
            $table->timestampTz('starts_at');
            $table->timestampTz('ends_at');
            $table->timestampTz('closed_at')->nullable();
            $table->foreignId('created_by_user_id')->constrained('users')->restrictOnDelete();
            $table->timestampsTz();
            $table->index(['school_id', 'starts_at']);
        });
        Schema::create('assessment_submissions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('assessment_period_id')->constrained()->restrictOnDelete();
            $table->foreignId('student_id')->constrained()->restrictOnDelete();
            // Texto do estudante: dado sensível. Nunca registrar em logs ou mensagens de erro.
            $table->text('body');
            $table->timestampTz('submitted_at');
            // Um texto por estudante por período, garantido pelo banco.
            $table->unique(['assessment_period_id', 'student_id']);
        });
    }

    public function down(): void
    {
        if (Schema::hasTable('assessment_submissions') && DB::table('assessment_submissions')->exists()) {
            throw new RuntimeException('Existem textos de estudantes. Restaure ou migre explicitamente antes de remover.');
        }
        Schema::dropIfExists('assessment_submissions');
        Schema::dropIfExists('assessment_periods');
    }
};
