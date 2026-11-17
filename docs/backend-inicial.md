# Backend inicial — execução e conexão ao Supabase

Data: 17/11/2026. Escopo desta entrega: fundação Laravel, sem autenticação do piloto e sem ligação do React à API.

> Registro da primeira entrega. A autenticação foi acrescentada posteriormente e está descrita em [acessos-backend.md](acessos-backend.md). O React ainda não foi integrado; a configuração do projeto existente está em [supabase-piloto.md](supabase-piloto.md). As tabelas provisórias citadas abaixo foram substituídas pela migração de identidades.

## O que está disponível

- Laravel 13 em `backend/`, com dependências fixadas em `composer.lock`.
- PostgreSQL como conexão padrão, schema `alumia` e TLS requerido por padrão.
- Migração inicial de escolas, além das tabelas de infraestrutura do skeleton.
- Seeder vazio: nenhuma conta, escola ou estudante demonstrativo é criado automaticamente.
- `GET /up`: confirma inicialização do Laravel, sem consultar o banco.
- `GET /api/v1/health`: retorna `200 {"status":"ready"}` somente quando a conexão e as tabelas básicas existem; retorna `503 {"status":"not_ready"}` nas demais situações, sem detalhes internos.
- Testes SQLite e PostgreSQL, com execução configurada no GitHub Actions.

`ready` significa apenas que esta fundação está disponível. Não significa que autenticação, permissões, avaliações, IA ou operação do piloto estejam prontas.

A raiz do backend retorna HTTP 503 com `implementation_in_progress`. O React legado segue preservado e pode ser usado como demonstração local; não foi integrado nem convertido em versão segura para estudantes.

## Pré-requisitos

PHP 8.3+ com extensões exigidas pelo Laravel, incluindo PDO PostgreSQL. Para os testes, também PDO SQLite, DOM, XML e mbstring. Composer 2 para instalar o backend; Node.js e npm para o React existente.

Instalação: [Laravel 13](https://laravel.com/docs/13.x/installation).

```bash
cd backend
composer install
cp .env.example .env
php artisan key:generate
```

`key:generate` escreve uma chave local no `.env`, ignorado pelo Git. Cada ambiente real precisa de sua própria chave, estável entre deploys; a chave pública do PHPUnit é exclusiva de testes.

Não rodar migrações até confirmar a conexão. Não usar o banco real para testar com `RefreshDatabase`, `migrate:fresh` ou `migrate:rollback`.

## Configurar o Supabase Free

O projeto na nuvem ainda não foi criado nem conectado por esta entrega. O titular deve selecionar o plano gratuito, definir a região com os responsáveis e guardar a senha fora do repositório e do chat.

1. No projeto Supabase, abrir **Connect** e copiar os parâmetros do **Session Pooler**, geralmente porta 5432.
2. Preencher `DB_HOST`, `DB_PORT`, `DB_DATABASE`, `DB_USERNAME` e `DB_PASSWORD` no `.env` local ou nos segredos da hospedagem. Não colocar credenciais no React.
3. Manter `DB_CONNECTION=pgsql`, `DB_SCHEMA=alumia` e `DB_SSLMODE=require`. Para validação completa do certificado, configurar o certificado raiz e o modo correspondente antes de habilitar `verify-full`.
4. Preparar o schema privado com uma credencial administrativa, antes de migrar:

```sql
CREATE SCHEMA IF NOT EXISTS alumia;
```

5. Se a aplicação não utilizar a Data API, desabilitá-la no Supabase e confirmar que `alumia` não está exposto. Revisar privilégios antes de qualquer dado real.
6. Definir credencial de migração e credencial de execução com privilégios apropriados. Não colocar senha em comandos versionados, logs ou imagens Docker.

O comando SQL é uma instrução de configuração, não foi executado na nuvem. Se o schema pertencer a outra role, o administrador deve conceder os privilégios necessários antes das migrações.

Fonte: [Supabase e Laravel](https://supabase.com/docs/guides/getting-started/quickstarts/laravel).

Depois de confirmar o destino, executar no ambiente autorizado:

```bash
php artisan config:clear
php artisan migrate
php artisan migrate:status
```

As tabelas `users`, `password_reset_tokens`, `sessions`, `cache`, `cache_locks`, `jobs`, `job_batches` e `failed_jobs` vieram do skeleton; `schools` foi acrescentada nesta entrega. `users` ainda é um contrato provisório, sem endpoints. Não representa o cadastro estudantil nem a matriz final de profissionais. Não há rota pública de cadastro ou recuperação de senha.

Não há worker configurado e o padrão é `QUEUE_CONNECTION=sync`. A existência das tabelas de jobs não implica processamento assíncrono ativo.

## Executar localmente

Com `.env` e banco de desenvolvimento configurados:

```bash
php artisan serve --host=127.0.0.1 --port=8000
```

Para HTTP local, usar `SESSION_SECURE_COOKIE=false`; na hospedagem HTTPS, manter `true`. `artisan serve` é somente para desenvolvimento.

Em outro terminal:

```bash
curl -i http://127.0.0.1:8000/up
curl -i http://127.0.0.1:8000/api/v1/health
```

Não ligar a interface antiga à API substituindo apenas a URL: persistência, autenticação e permissões ainda precisam de implementação conjunta.

## Verificações

```bash
composer validate --strict
composer lint
composer test
```

O teste rápido usa SQLite em memória. O teste específico de schema PostgreSQL é pulado nessa execução. A suíte usa chave pública de teste e força `DB_URL` vazio para evitar herdar uma URL real.

Para integração PostgreSQL, criar um banco descartável chamado `alumia_test`, com um schema `alumia_testing`, e informar a conexão desse ambiente. Os nomes são condições de segurança da suíte: o banco precisa terminar em `_test` e o schema em `_testing`.

```bash
DB_CONNECTION=pgsql DB_HOST=127.0.0.1 DB_PORT=5432 \
DB_DATABASE=alumia_test DB_USERNAME=alumia_test \
DB_SCHEMA=alumia_testing DB_SSLMODE=disable composer test
```

Nesse exemplo, `disable` só vale para PostgreSQL local isolado. A senha do ambiente descartável deve ser fornecida localmente por variável de ambiente, sem entrar no Git. Não apontar testes ao projeto Supabase dos participantes: a suíte usa operações destrutivas no banco de testes.

O workflow `.github/workflows/backend.yml` prepara PostgreSQL 16 e o schema descartável, valida o Composer, verifica estilo e executa as duas suítes. Foi adicionado ao código, mas ainda não foi executado pelo GitHub Actions nesta entrega.

## Validação realizada nesta entrega

- `composer validate --strict`: aprovado.
- PHPUnit com SQLite: 8 testes, 19 asserções; 1 teste específico de PostgreSQL pulado.
- PHPUnit com PostgreSQL 16 local isolado: 8 testes, 23 asserções; nenhum teste pulado.
- Rollback e reaplicação de todas as migrações no PostgreSQL descartável: aprovados.
- Laravel Pint: estilo verificado após ajuste automático.
- Script local `verify-project.sh`: estrutura, separação visual do estudante, datas locais e build Vite aprovados.
- Supabase, Render, navegador e provedor de IA: não homologados nesta etapa.

Ferramentas usadas para validar foram extraídas em uma pasta de trabalho fora do repositório, sem instalar PHP, Node ou PostgreSQL no sistema. A execução cotidiana deve usar os pré-requisitos acima ou um ambiente Docker preparado em etapa própria.

## Próximas entregas

1. Confirmar matriz de perfis e contrato de credenciais, substituindo `users` provisório pelo modelo institucional.
2. Implementar autenticação, troca de senha temporária, token estudantil e isolamento entre escolas, com testes de acesso cruzado.
3. Integrar React à API e remover a persistência demonstrativa do caminho do piloto.
4. Criar e validar o container que serve React e Laravel na mesma origem; somente então preparar o Render Free.
5. Implementar janelas e envio de avaliações; viabilizar e testar IA no orçamento disponível.

O backend inicial não torna o piloto liberável. Continuam valendo as condições de [arquitetura e operação](arquitetura-piloto.md) e da especificação consolidada.
