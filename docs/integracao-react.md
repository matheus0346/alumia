# React integrado ao Laravel

Data: 17/11/2026. Integração de acessos implementada; avaliações, indicadores reais e Lumi continuam pendentes. Nenhum deploy realizado.

## Versão padrão e demonstração

`npm run dev` e `npm run build` selecionam `src/pilot/PilotApp.jsx`. O alias do Vite resolve apenas essa aplicação: o bundle padrão não importa o contexto, armazenamento, credenciais nem análise simulada da demonstração.

`npm run dev:demo` e `npm run build:demo` selecionam explicitamente `src/DemoApp.jsx`. A demonstração tem aviso permanente e usa apenas dados fictícios. O workflow do GitHub Pages publica esse modo estático; não hospeda PHP nem constitui o piloto integrado.

O build padrão gera `dist/build-mode.json`, verifica a ausência de código legado sensível e copia os arquivos para `backend/public/app/`, ignorados pelo Git. Laravel entrega o HTML em `/` somente com marcador `pilot`; um build ausente, inválido ou de demonstração retorna 503. Recursos estáticos ficam em `/app/assets/`. Não há fallback HTML para rotas `/api` inexistentes.

## Fluxos implementados

- Estudante entra com token individual; escola e administração entram com usuário e senha.
- Sessão restaurada pela API ao abrir a página; logout confirmado no servidor.
- Troca obrigatória da senha temporária antes de abrir a área institucional.
- Administrador lista/cria escolas, redefine senhas e suspende/reativa acessos.
- Escola lista/cria códigos estudantis, gera novo token e revoga acessos.
- Senhas temporárias e tokens aparecem uma vez, apenas em memória. Não são persistidos no navegador.
- Listas paginadas, carregamento, falhas e confirmações de ações são explícitos. Área estudantil informa as funcionalidades ainda indisponíveis.
- Formulário de contato do piloto não simula recebimento de mensagens. O conteúdo institucional reaproveitado ainda precisa da revisão editorial prevista na especificação.

O cliente usa cookies da mesma origem, `Accept: application/json` e CSRF obtido por `/api/v1/auth/csrf`. O CSRF é renovado após login, troca de senha e logout. Somente rejeição explícita 419 permite uma repetição automática. Falha de rede ou 5xx nunca repete uma escrita automaticamente, pois a operação pode já ter sido concluída.

## Desenvolvimento

Pré-requisitos: Node 22, PHP 8.3+, Composer e PostgreSQL configurado conforme os documentos do backend. Não usar as contas demonstrativas como contas da API.

```bash
npm ci
cd backend
composer install
# Configurar .env privado, APP_KEY e banco conforme docs/supabase-piloto.md.
# Migrar somente o destino explicitamente autorizado.
php artisan serve --host=127.0.0.1 --port=8000
```

Em outro terminal, na raiz:

```bash
npm run dev
```

O Vite encaminha `/api` ao Laravel na porta 8000. Abrir o endereço fornecido pelo Vite. O navegador nunca recebe credenciais PostgreSQL nem chave administrativa Supabase.

Para conferir o build integrado local:

```bash
npm run build
cd backend
php artisan serve --host=127.0.0.1 --port=8000
```

Abrir `http://127.0.0.1:8000`. Esse servidor serve apenas para desenvolvimento. O container e o servidor HTTP de implantação continuam pendentes.

## Validação desta entrega

- Build padrão e inspeção automatizada de isolamento do bundle passaram.
- Quatro testes Node cobrem cookies/renovação de CSRF, repetição limitada do 419, ausência de repetição em falhas incertas e recusa de URLs externas/respostas HTML.
- 27 testes Laravel passaram no PostgreSQL local descartável, com 140 asserções. A mesma suíte passou no SQLite com uma verificação PostgreSQL pulada.
- Verificação HTTP local validou sessões persistidas, CSRF, senha obrigatória, isolamento estudantil, revogação e logout.
- No navegador, login institucional e painel administrativo com escola sintética foram conferidos na aplicação servida pelo Laravel, usando SQLite local. Não houve ensaio visual completo de todos os perfis ou dispositivos.
- Nenhum teste automatizado usa o Supabase real.

Para repetir: `npm test`, `npm run build`; em `backend/`, `composer validate --strict`, `composer lint`, `composer test`. Para PostgreSQL, seguir as variáveis e as proteções documentadas em `docs/acessos-backend.md`.

## Próxima etapa operacional

Configurar os segredos de execução do Laravel, preparar schema e privilégios privados, executar as migrações na etapa autorizada e criar o administrador inicial com entrada oculta. Validar novamente a aplicação completa no ambiente de homologação antes de admitir participantes.
