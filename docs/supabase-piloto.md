# Supabase — configuração do projeto do piloto

Data: 17/11/2026. Projeto existente informado pelo responsável:

- Referência pública: `gnylrgobjsecphldkkfv`.
- URL pública do serviço: `https://gnylrgobjsecphldkkfv.supabase.co`.
- Plano pretendido: Free. Ainda não verificado na conta.
- Estado verificado: integração Codex autenticada; projeto AlumIA em `ACTIVE_HEALTHY`, região `ca-central-1`, PostgreSQL 17. Consulta `SELECT 1` concluída com sucesso. Consulta a `information_schema.tables` não encontrou tabelas de aplicação em `public` ou `alumia`. Advisor de segurança sem achados nesta consulta; isso não valida uma aplicação ainda não implantada.

Essa URL identifica a API do projeto. **Não é o host PostgreSQL** que deve ser copiado para `DB_HOST`.

## Preparação

1. No painel do projeto, confirmar plano Free e região.
2. Em **Connect**, obter os parâmetros reais do **Session Pooler**. Não deduzir o endereço do pooler a partir da URL pública.
3. Preencher `DB_HOST`, `DB_PORT`, `DB_DATABASE`, `DB_USERNAME`, `DB_PASSWORD` no `.env` ignorado do backend ou no gerenciador de segredos do ambiente. Nunca enviar essas credenciais pelo chat ou versioná-las.
4. Manter `DB_SCHEMA=alumia` e `DB_SSLMODE=require`. O usuário de execução precisa dos privilégios pertinentes, sem acesso administrativo desnecessário.
5. Criar o schema privado com credencial autorizada, se ainda não existir:

```sql
CREATE SCHEMA IF NOT EXISTS alumia;
```

6. Confirmar que o schema não está exposto à Data API. Se a aplicação não usar essa API, desabilitá-la, conforme a arquitetura adotada.

Somente consultas de leitura foram executadas na nuvem nesta entrega. Schema, privilégios e migrações ainda não foram aplicados. Inspecionar tabelas, grants e dados existentes antes de executar mudanças; não apagar ou sobrescrever um projeto já utilizado.

## Verificação sem revelar credenciais

Antes de migrar:

```bash
cd backend
php artisan config:clear
php artisan alumia:database:check --schema-only
```

O comando é somente leitura. Verifica PostgreSQL e o schema privado efetivamente selecionado, sem imprimir host, senha, SQL interno ou erro bruto.

Depois de confirmar o destino e autorizar a migração:

```bash
php artisan migrate
php artisan alumia:database:check
```

O segundo comando verifica também as tabelas necessárias. Se falhar, corrigir configuração ou migrações; não contornar a checagem usando `public`.

Não rodar PHPUnit, `migrate:fresh` ou `migrate:rollback` no projeto dos participantes. Os testes exigem banco descartável `*_test` e schema `*_testing` e não são um procedimento de configuração do Supabase real.

## O que ainda precisa da conta do responsável

- Acesso, região e disponibilidade verificados pela integração. Confirmar o plano Free na conta.
- Preparar schema, privilégios e exposição da API.
- Configurar segredos e executar as migrações autorizadas.
- Criar o administrador inicial em terminal confiável com entrada oculta.
- Definir backup protegido e testar restauração fora do ambiente dos participantes.

Instalar a integração no Codex autoriza ferramentas a acessar o Supabase; isso é diferente da conexão PostgreSQL de execução do Laravel. Mesmo com a integração, a aplicação ainda precisa de suas próprias credenciais privadas no ambiente.

Fontes: [Laravel com Supabase](https://supabase.com/docs/guides/getting-started/quickstarts/laravel), [proteção da Data API](https://supabase.com/docs/guides/api/securing-your-api) e [limites do Free](https://supabase.com/pricing).
