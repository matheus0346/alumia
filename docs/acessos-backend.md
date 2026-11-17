# Acessos reais do backend — contrato e validação

Data: 17/11/2026. Estado: API implementada e testada localmente; React e projeto Supabase ainda não integrados. Esta entrega não libera o piloto.

## Matriz técnica mínima

| Identidade | Entrada | Recursos desta etapa |
| --- | --- | --- |
| Administrador geral | Usuário/senha | Criar e listar escolas, suspender acesso institucional e redefinir sua senha |
| Escola | Usuário/senha | Consultar sua instituição, listar/cadastrar seus códigos estudantis, emitir, rotacionar e revogar seus tokens |
| Estudante | Token individual | Consultar a própria sessão e encerrá-la |

O administrador geral não acessa listagens de estudantes. Escola não escolhe a instituição nas requisições: o backend usa o vínculo da sessão. Ainda não existem endpoints de textos, indicadores ou chat nesta entrega.

Os papéis `admin` e `school` são identidades institucionais, separadas do modelo `Student`. A definição de profissionais específicos e suas permissões de acompanhamento permanece uma decisão institucional antes de disponibilizar dados socioemocionais.

## Proteções implementadas

- Sessões de servidor, cookies e CSRF no grupo web do Laravel, inclusive nas rotas `/api/v1/auth/*`.
- Login institucional com identificador normalizado, senha com hash e mensagens genéricas para conta desconhecida, senha incorreta e acesso inativo.
- Limite de tentativas por combinação de conta/IP e limite agregado por IP; login estudantil limitado por IP.
- Senha temporária gerada pelo servidor, exibida uma única vez na resposta administrativa, exigindo troca antes dos recursos da escola.
- Troca de senha exige senha atual, confirmação e uma senha diferente de pelo menos 12 caracteres. O limite de 72 bytes e rejeição de caracteres nulos evitam ambiguidades do bcrypt.
- Versão de credencial revoga sessões anteriores após redefinição ou troca; versão de token revoga sessões estudantis após rotação/revogação.
- Tokens de 256 bits gerados com `random_bytes`, armazenados apenas como SHA-256. Esse hash é adequado ao token aleatório de alta entropia; senhas humanas usam o hash de senha do Laravel.
- Token entregue somente na criação/rotação, nunca na listagem. Nenhum segredo deve entrar em URL, logs, Git ou tickets.
- Eventos de alteração de credenciais registram ator, alvo, ação e data, sem senha ou token. Não há endpoint público para consultar esses eventos.
- Sem cadastro público, recuperação pública institucional ou importação automática dos dados demonstrativos.
- Respostas autenticadas e de emissão de credenciais usam `Cache-Control: no-store, private`.

A senha temporária retornada ao administrador não é enviada automaticamente a ninguém. Verificação da solicitação e canal de entrega segura continuam sob responsabilidade da operação e precisam ser definidos para o piloto.

Tokens não expiram automaticamente nesta etapa; podem ser rotacionados/revogados e são bloqueados quando estudante/escola estiverem suspensos. A política definitiva de expiração/recuperação é pendente. `SESSION_LIFETIME` controla a duração da sessão, não a validade do token.

## Primeiro administrador

Depois de configurar o banco e aplicar as migrações no ambiente autorizado:

```bash
cd backend
php artisan alumia:admin:create identificador-do-administrador
```

O comando solicita a senha de forma oculta, não aceita senha em argumento e não cria uma credencial padrão. Execute em terminal confiável; não grave a sessão. Nenhum administrador real foi criado nesta entrega.

## Contrato HTTP

Todas as rotas abaixo usam a mesma origem da aplicação. Enviar `Accept: application/json`. Mutações exigem cookie de sessão e `X-CSRF-TOKEN`, obtido pela rota de CSRF. No futuro cliente React, manter CSRF somente em memória e usar `credentials: 'same-origin'`; não salvar tokens de sessão no armazenamento local.

| Método e rota | Entrada / resultado |
| --- | --- |
| `GET /api/v1/auth/csrf` | Retorna `csrf_token` e estabelece sessão |
| `POST /api/v1/auth/institution/login` | `username`, `password`; retorna identidade institucional |
| `POST /api/v1/auth/student/login` | `token`; retorna identidade estudantil, sem indicadores |
| `GET /api/v1/auth/session` | Retorna somente a identidade atual válida |
| `PUT /api/v1/auth/password` | `current_password`, `password`, `password_confirmation`; retorna 204 |
| `POST /api/v1/auth/logout` | Encerra ambos os guards; retorna 204 |
| `GET /api/v1/admin/schools` | Lista paginada de escolas, sem credenciais ou alunos |
| `POST /api/v1/admin/schools` | `name`, `username`; retorna escola e senha temporária uma única vez |
| `PATCH /api/v1/admin/schools/{school}` | `active`; suspende/reativa o acesso da instituição |
| `POST /api/v1/admin/schools/{school}/password` | Redefinição administrativa; retorna nova senha temporária |
| `GET /api/v1/school` | Escola vinculada à sessão |
| `GET /api/v1/school/students` | Lista paginada somente dos códigos da própria escola |
| `POST /api/v1/school/students` | `code`; retorna código e token individual uma única vez |
| `POST /api/v1/school/students/{student}/token` | Rotaciona/reativa token da própria escola |
| `DELETE /api/v1/school/students/{student}/token` | Revoga o token e sessões vinculadas |

Após login, logout ou troca de senha, buscar novamente o CSRF antes da próxima mutação, pois a sessão/token são regenerados. Trocar de tipo de login encerra a identidade anterior no mesmo navegador.

Respostas relevantes: 401 para ausência/revogação de sessão, 403 para suspensão, perfil proibido ou troca obrigatória, 404 para estudante fora da instituição, 419 para CSRF inválido, 422 para validação/credencial inválida e 429 para excesso de tentativas.

## Migrações e compatibilidade

`2026_11_17_010000_add_pilot_identities` substitui os campos provisórios de nome/e-mail de `users` pelo usuário institucional e remove a tabela de recuperação pública do skeleton. Cria `students` e `credential_events`, com vínculos por chave estrangeira.

A migração para se as tabelas provisórias já contiverem dados, exigindo um plano explícito em vez de convertê-los silenciosamente. O rollback também se recusa a apagar identidades ou eventos existentes. Não fazer downgrade no banco de participantes como rotina de recuperação.

Nenhuma tabela de dados reais foi alterada nesta entrega. Os exercícios de migração/rollback usaram somente banco local descartável.

## Verificações

- PHPUnit SQLite: 26 testes, 128 asserções; 1 teste específico de PostgreSQL pulado.
- PHPUnit PostgreSQL 16: 26 testes, 133 asserções, nenhum teste pulado.
- HTTP real, com sessões no PostgreSQL e cookies separados: CSRF, login administrativo, criação de escola, troca obrigatória, emissão de token, isolamento de perfil, revogação da sessão institucional após redefinição e logout estudantil verificados.
- Rollback e reaplicação de todas as migrações no banco descartável verificados.
- O fluxo de CSRF é exercitado sem o bypass padrão de testes do Laravel.

Os testes usam dados sintéticos. Não representam homologação com estudantes, teste de carga ou validação da operação no Supabase/Render.

## Pendências

1. Autorizar conexão ao projeto Supabase existente e configurar schema e segredos localmente.
2. Integrar o React com estes endpoints, substituindo os logins e o armazenamento demonstrativos.
3. Definir políticas de token, verificação de redefinição e perfis profissionais antes do piloto.
4. Implementar avaliações, resultados e controles de dados; homologar hospedagem.

Referências: [backend inicial](backend-inicial.md), [arquitetura](arquitetura-piloto.md), [spec](SPEC_ALUMIA.md) e [Supabase do piloto](supabase-piloto.md).
