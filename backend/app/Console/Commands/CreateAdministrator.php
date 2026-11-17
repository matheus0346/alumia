<?php

namespace App\Console\Commands;

use App\Models\CredentialEvent;
use App\Models\User;
use App\Rules\PasswordBytes;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Str;

class CreateAdministrator extends Command
{
    protected $signature = 'alumia:admin:create {username : Identificador do administrador}';

    protected $description = 'Cria administrador sem expor a senha em argumentos ou saída.';

    public function handle(): int
    {
        if (! $this->input->isInteractive()) {
            $this->error('Execute interativamente para informar a senha de forma oculta.');

            return self::FAILURE;
        }
        $data = ['username' => Str::lower(trim($this->argument('username'))), 'password' => $this->secret('Senha inicial (mínimo 12 caracteres)')];
        $validator = Validator::make($data, ['username' => ['required', 'min:3', 'max:80', 'regex:/\A[a-z0-9_.-]+\z/', 'unique:users,username'], 'password' => ['required', 'string', 'min:12', 'max:72', new PasswordBytes]]);
        if ($validator->fails()) {
            $this->error('Identificador indisponível/inválido ou senha fora do tamanho permitido.');

            return self::FAILURE;
        }
        DB::transaction(function () use ($data) {
            $user = User::create([...$data, 'role' => 'admin', 'must_change_password' => false]);
            CredentialEvent::create(['target_user_id' => $user->id, 'action' => 'admin_created']);
        });
        $this->info('Administrador criado. Nenhuma senha foi gravada na saída.');

        return self::SUCCESS;
    }
}
