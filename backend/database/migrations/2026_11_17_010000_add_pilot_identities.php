<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (DB::table('users')->exists() || DB::table('password_reset_tokens')->exists()) {
            throw new RuntimeException('The provisional identity tables contain data. An explicit migration plan is required.');
        }
        Schema::table('users', function (Blueprint $table) {
            $table->dropUnique(['email']);
            $table->dropColumn(['name', 'email', 'email_verified_at']);
            $table->string('username', 80)->unique();
            $table->enum('role', ['admin', 'school']);
            $table->foreignId('school_id')->nullable()->constrained()->restrictOnDelete();
            $table->boolean('active')->default(true);
            $table->boolean('must_change_password')->default(true);
            $table->unsignedInteger('credential_version')->default(1);
        });
        Schema::drop('password_reset_tokens');
        Schema::create('students', function (Blueprint $table) {
            $table->id();
            $table->foreignId('school_id')->constrained()->restrictOnDelete();
            $table->string('code', 40);
            $table->string('token_hash', 64)->unique();
            $table->unsignedInteger('token_version')->default(1);
            $table->boolean('active')->default(true);
            $table->timestampsTz();
            $table->unique(['school_id', 'code']);
        });
        Schema::create('credential_events', function (Blueprint $table) {
            $table->id();
            $table->foreignId('actor_user_id')->nullable()->constrained('users')->restrictOnDelete();
            $table->foreignId('target_user_id')->nullable()->constrained('users')->restrictOnDelete();
            $table->foreignId('target_student_id')->nullable()->constrained('students')->restrictOnDelete();
            $table->string('action', 40);
            $table->timestampTz('created_at')->useCurrent();
        });
    }

    public function down(): void
    {
        if (DB::table('users')->exists() || DB::table('students')->exists() || DB::table('credential_events')->exists()) {
            throw new RuntimeException('Identity data exists. Restore or migrate it explicitly before downgrading.');
        }
        Schema::drop('credential_events');
        Schema::drop('students');
        Schema::table('users', function (Blueprint $table) {
            $table->dropConstrainedForeignId('school_id');
            $table->dropUnique(['username']);
            $table->dropColumn(['username', 'role', 'active', 'must_change_password', 'credential_version']);
            $table->string('name');
            $table->string('email')->unique();
            $table->timestamp('email_verified_at')->nullable();
        });
        Schema::create('password_reset_tokens', function (Blueprint $table) {
            $table->string('email')->primary();
            $table->string('token');
            $table->timestamp('created_at')->nullable();
        });
    }
};
