# AlumIA — instruções do repositório

Leia `docs/devops.md`, `docs/arquitetura-piloto.md` e a tarefa antes de alterar o projeto. Para PHP, leia também `backend/AGENTS.md`.

- Arquitetura adotada: React + Laravel + PostgreSQL. Piloto e demonstração são builds separados; não reintroduzir armazenamento ou login demonstrativo no piloto.
- Trabalhar em branch curta por tarefa, partindo da base correta e preservando alterações existentes. Usar PR e commits com uma responsabilidade clara. Não publicar diretamente na main.
- Executar as verificações adequadas de `CONTRIBUTING.md`. Não declarar CI remota aprovada apenas por testes locais.
- Manter `CI required` estável: testes de frontend, backend e workflows são obrigatórios. Não usar filtros de caminho que deixem o check obrigatório pendente, nem transformar falha em sucesso para liberar merge.
- Nunca usar dados reais, segredos de produção ou banco do piloto na CI. Não registrar credenciais, tokens ou textos de alunos em logs ou artefatos.
- Migrações e deploys são etapas operacionais próprias. Usar `docs/operacao.md`; um merge não autoriza migração remota, publicação do piloto nem contratação de serviços.
- GitHub Pages publica apenas a demonstração e por acionamento manual. Não acionar publicação como teste de CI.
- Fixar Actions externas por SHA completo, mantendo comentário de versão; revisar atualizações do Dependabot, sem automerge.
- Antes de adicionar uma skill local, verificar se instruções permanentes em AGENTS.md e procedimentos em docs resolvem o caso. Evitar regras duplicadas.
- A skill legada `.agents/skills/alumia-refactor` descreve o protótipo; a arquitetura do piloto e a especificação atual prevalecem para o produto real.
