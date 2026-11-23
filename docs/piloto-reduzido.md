# Piloto reduzido — avaliação mínima (teste de 27/11/2026)

Data: 23/11/2026. Teste com cerca de 20 estudantes da Escola Atual. Plano B: demonstração com dados fictícios (Pages). Este documento descreve o escopo implementado em código e o roteiro de publicação. **O código deste PR não foi publicado nem migrado em nenhum ambiente remoto.**

## Escopo

Entra: período de avaliação, envio de um texto pelo estudante e leitura pela escola. Fica fora: análise dos 12 indicadores, chat da Lumi, login por profissional (o teste usa o login único da escola) e envio atrasado. Não há análise automática nem resultado de IA.

## Regras (DEC-06, decididas pela equipe para este teste)

- Só o administrador geral abre e encerra períodos. A escola e o estudante não alteram períodos.
- Janela de 7 dias em America/Sao_Paulo: abre às 00:00:00 do 1º dia e fecha às 23:59:59 do 7º (inclusive); validado no servidor. O instante 00:00:00 do dia seguinte já é bloqueado. Encerrar manualmente bloqueia na hora.
- Um texto por estudante por período, sem edição nem reenvio; a unicidade (período, estudante) é garantida pelo banco.
- Fora da janela o envio é bloqueado. Não existe autorização de atraso.
- O administrador geral **não** lê textos (DEC-05): não há rota para isso e a listagem de períodos só traz a contagem de envios.
- Uma escola só enxerga períodos e textos próprios; período de outra escola responde 404.
- Texto: obrigatório, não pode ser só espaços, no máximo 5000 caracteres (limite exibido na tela e validado no servidor).
- Períodos da mesma escola não podem se sobrepor; a data de início não pode ser anterior a hoje.

## API

| Rota | Perfil | Função |
| --- | --- | --- |
| `GET /api/v1/admin/schools/{school}/assessment-periods` | admin | lista períodos e contagem de envios |
| `POST /api/v1/admin/schools/{school}/assessment-periods` | admin | `start_date` (AAAA-MM-DD) abre período de 7 dias |
| `POST /api/v1/admin/assessment-periods/{period}/close` | admin | encerra o período |
| `GET /api/v1/student/assessment` | estudante | período aberto da escola, se já enviou, `max_length` |
| `POST /api/v1/student/assessment-periods/{period}/submission` | estudante | `text`; 201 enviado, 409 `already_submitted` ou `period_closed`, 422 texto inválido, 503 `save_failed` |
| `GET /api/v1/school/assessment-periods` | escola | períodos da escola com contagem |
| `GET /api/v1/school/assessment-periods/{period}/submissions` | escola | textos paginados (código do estudante, texto, horário) |

Mutações exigem sessão e CSRF, como as demais. O envio tem limite de 10 por minuto por estudante (não por IP). Falha de gravação devolve 503 e a tela diz que o texto **não** foi enviado; nada é confirmado antes de salvar.

## Privacidade

O texto nunca é registrado em logs, mensagens de erro ou testes. Erros de gravação não são relatados com a mensagem do banco (que poderia conter o texto); apenas um aviso com os IDs. `text` está na lista de campos não reexibidos em exceções. A tela do estudante informa quem lê (coordenação e psicologia da escola), que não há resposta imediata nem atendimento de emergência, e orienta procurar um adulto de confiança ou o CVV (188). **Esse aviso é uma sugestão e precisa de revisão do responsável institucional antes do teste.** Os textos continuam sendo dados sensíveis: ver DEC-04 (consentimento, retenção e exclusão), ainda sem decisão registrada.

## Proxy e limites por IP

Uma turma costuma sair pelo mesmo IP da escola. O limite de login estudantil por IP subiu de 20 para 120 por minuto (o token tem 256 bits) e o de CSRF de 60 para 200. O login institucional ganhou um limite só por conta (20/min), independente do IP, para o caso de o IP ser falsificável por cabeçalho; efeito colateral: tentativas repetidas contra uma conta podem bloquear o login dela por 1 minuto. Atrás do Render, defina `TRUSTED_PROXIES=*` para o Laravel enxergar o IP real e o esquema HTTPS; use isso somente porque o container só é alcançável pelo proxy do provedor.

## Publicação no Render Free (preparada, não executada)

`render.yaml` descreve o serviço com o `Dockerfile` da main, `healthCheckPath: /api/v1/health` e `autoDeploy: false`. O SHA entra por `RENDER_GIT_COMMIT` (ou `--build-arg GIT_SHA`).

Variáveis (valores só no painel do Render; nunca no Git, no chat ou em logs):

| Variável | Valor |
| --- | --- |
| `APP_KEY` | gerar uma vez: `docker run --rm alumia:IMAGEM php -r 'echo "base64:".base64_encode(random_bytes(32));'`; não trocar a cada deploy |
| `APP_URL` | URL pública do serviço (https) |
| `DB_HOST`, `DB_PORT`, `DB_DATABASE`, `DB_USERNAME`, `DB_PASSWORD` | parâmetros do **Session Pooler** do Supabase (Connect), de um usuário com privilégios mínimos no schema `alumia` |
| `DB_SCHEMA` | `alumia` |
| `DB_SSLMODE` | `require` |
| `SESSION_SECURE_COOKIE` | `true` |
| `TRUSTED_PROXIES` | `*` |

Padrões da imagem (não precisam ser definidos): `APP_ENV=production`, `APP_DEBUG=false`, `LOG_LEVEL=warning`, `SESSION_ENCRYPT=true`, `APP_LOCALE=pt_BR`.

Migrações: o plano Free do Render não tem etapa de pré-deploy; a migração é um passo **separado e serializado**, executado uma vez a partir da máquina do responsável, com a mesma imagem e as credenciais do cofre (arquivo temporário com permissão 600, apagado depois):

```bash
docker run --rm --env-file /caminho/protegido/migracao.env IMAGEM php artisan migrate --force
docker run --rm --env-file /caminho/protegido/migracao.env IMAGEM php artisan alumia:database:check
```

A migração deste PR é aditiva (duas tabelas novas). Antes dela: `CREATE SCHEMA IF NOT EXISTS alumia;`, conferência de privilégios e backup (abaixo). Administrador inicial: `docker run -it --rm --env-file … IMAGEM php artisan alumia:admin:create IDENTIFICADOR` (senha pedida com entrada oculta).

**Ordem:** migrar antes do primeiro deploy: `/api/v1/health` (health check do Render) responde 503 enquanto o banco não tiver as tabelas, e o deploy não ficaria saudável. Antes da aula, acesse `/up` alguns minutos antes para acordar o serviço (a primeira requisição do Free leva cerca de 1 minuto).

Verificação pós-deploy (sem dados reais): `/up`, `/api/v1/health`, login do administrador, criação da escola, período, envio sintético, leitura pela escola, tudo com dados sintéticos; só depois cadastrar os códigos e tokens dos estudantes reais.

## Backup e restauração (OPS-005)

Scripts prontos, testados contra um PostgreSQL descartável:

```bash
# Backup para diretório protegido (chmod 700) FORA do repositório; variáveis DB_* exportadas a partir do cofre.
BACKUP_DIR=/caminho/protegido bash scripts/ops/backup-db.sh        # AGE_RECIPIENT=age1... cifra o dump
# Ensaio de restauração em banco descartável (nunca o original); só imprime contagens
bash scripts/ops/restore-test.sh /caminho/protegido/alumia-AAAAMMDDTHHMMSSZ.dump
```

O backup recusa diretório dentro de repositório Git ou com permissão aberta e não deixa arquivo parcial se o `pg_dump` falhar. O dump contém textos de estudantes: não anexar ao GitHub, ao chat ou a artefatos. O disco do container não é destino de backup. O tempo de restauração medido e a idade do dump são a base para RTO e RPO; cadastrar o responsável e o destino externo ainda depende da equipe.

## Riscos para o dia 27

- Render Free dorme após inatividade (primeira requisição pode levar cerca de um minuto): acordar o serviço antes da aula, sem monitor artificial.
- Supabase Free pode pausar por inatividade; confirmar o estado do projeto na quinta.
- 20 estudantes simultâneos em instância Free: não houve teste de carga.
- DEC-04 (consentimento/retenção, menores e LGPD) e o texto de aviso ao estudante dependem de revisão humana; sem isso o teste com alunos reais não deve ocorrer.
- Primeira migração e primeiro deploy reais acontecem só na quinta, com margem de um dia.
