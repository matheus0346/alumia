# Como contribuir

1. Escolher uma issue/tarefa e a base correta. `main` representa a versão estável; usar branches curtas, por exemplo `feat/ALU-010-avaliacoes` ou `chore/devops-foundation`. Não há branch develop permanente.
2. Fazer commits pequenos e completos. Usar títulos como `feat:`, `fix:`, `test:`, `ci:` e `docs:`. Não misturar refatoração sem relação com a tarefa.
3. Abrir PR, explicar o problema e o comportamento final, informar validação e impacto no banco. Quando trabalhando sozinho, fazer revisão própria do diff e aguardar os checks; não exigir aprovação de outra pessoa se não houver revisor.
4. Fazer merge somente com `CI required` aprovado para a versão final. Preferir preservar commits atômicos; squash é aceitável quando o PR contém ajustes intermediários sem valor isolado.
5. Merge não publica. A publicação segue `docs/operacao.md`.

## Verificação local

Requisitos: Node 22 (`.nvmrc`), PHP 8.3+, Composer e PostgreSQL descartável para a verificação completa do backend.

Na raiz:

```bash
npm ci
npm audit --omit=dev --audit-level=high
npm test
npm run build
npm run build:demo
```

O último comando substitui `dist` pela demonstração; não usar esse diretório para servir o piloto. `npm run build` recria o piloto e sincroniza `backend/public/app`.

Em `backend/`:

```bash
composer install --no-interaction --prefer-dist
composer validate --strict
composer audit --no-interaction
composer lint
composer test
```

SQLite em memória é a verificação rápida. Repetir `composer test` com PostgreSQL isolado (`DB_DATABASE` terminado em `_test`, `DB_SCHEMA` em `_testing`) conforme `docs/acessos-backend.md`. Nunca usar credenciais do piloto. A CI prepara esse banco automaticamente.

Para workflows, executar `actionlint` na raiz. A versão e o SHA256 do binário estão no workflow de CI. Não é necessário instalar ferramentas globalmente.

Atualizações de dependências passam pelo mesmo PR e testes. Revisar alterações de versão principal separadamente. Manter `package-lock.json` e `backend/composer.lock`; usar `npm ci` e `composer install` para reproduzir instalações, sem atualizar versões durante um deploy.

Consulte `docs/devops.md` para o plano, as regras do GitHub ainda pendentes de ativação e as etapas futuras.
