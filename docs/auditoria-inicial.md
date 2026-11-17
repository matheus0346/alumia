# AlumIA — Auditoria inicial para o backend

Data: 17/11/2026. Base inspecionada: commit `4d03e8e`, antes da introdução do Laravel.

Estado de ALU-001: auditoria estática e build executados; homologação funcional no navegador e nas integrações ainda pendente. Não marcar a auditoria completa apenas por este registro.

## Inventário

| Área | Evidência | Conclusão |
| --- | --- | --- |
| Stack | `package.json`, `vite.config.js` | React 18, Vite 5, Recharts e JavaScript/JSX |
| Persistência | `src/services/storageService.js` | `localStorage` ou `window.storage`; sem banco central; fallback inicial com dados demo |
| Identidade | `src/components/auth/LoginModal.jsx` | Escola por token; aluno por código/senha; validação no navegador |
| Senhas e tokens | `src/utils/crypto.js` | Hash próprio não apropriado para senhas reais; token de escola gerado com `Math.random` |
| Mutação e análise | `src/context/AppContext.jsx` | Cadastro e envio centralizados no contexto React; sem autorização no servidor |
| Escola | `src/components/school/SchoolDashboard.jsx` | Filtragem local por `schoolToken`; não oferece isolamento contra acesso ao armazenamento |
| Atividade | `src/components/student/WeekView.jsx` | Diário semanal, sem janelas mensais administradas |
| IA | `src/services/aiService.js` | Chamada do navegador com chave `VITE_*`; fallback por regras; operação real não verificada |
| Indicadores | `src/constants/indicators.js`, `src/utils/clinical.js` | 12 chaves presentes; nomes e regras não comprovam validade clínica |
| Lumi | `docs/planejamento-lumi.md` | Planejamento, sem chat integrado |
| Hospedagem | `.github/workflows/deploy.yml` | Build e publicação estática no GitHub Pages |

## Preservar

Componentização React, identidade visual, páginas institucionais e conteúdos validados, visualizações aproveitáveis, definição existente dos 12 indicadores e separação visual entre estudante e profissionais. A lógica de datas locais passou na verificação do projeto.

## Corrigir antes do piloto

- Autenticação e autorização no servidor; testes de isolamento por instituição e perfil.
- Credenciais institucionais e tokens individuais de estudantes conforme o novo roteiro.
- Banco central com persistência entre dispositivos, sem importação automática de dados demo.
- Chaves e chamadas de IA no servidor, sem exposição em `VITE_*`.
- Falhas de persistência e processamento devem ser explícitas; não confirmar salvamento se o banco falhar.
- Fallback de demonstração não deve apresentar resultados como análise validada.
- Janelas de aplicação, política de dados, backup e operação humana.
- Rever alegações de anonimato absoluto, conformidade automática e linguagem clínica.

## Verificações e limites

`bash .agents/skills/alumia-refactor/scripts/verify-project.sh` passou com build Vite, estrutura modular, checagem estática da área do estudante e datas locais. Isso não testa login real, API de IA, comportamento visual ou isolamento de dados.

O build reportou um bundle acima de 500 kB. A instalação das dependências existentes reportou 3 vulnerabilidades (1 moderada e 2 altas); abrir tarefa de atualização e validar compatibilidade, sem executar `npm audit fix --force` indiscriminadamente. O backend não deve ser considerado responsável por corrigir automaticamente essas dependências do frontend.

Não foram realizados testes com dados reais, participantes, Supabase ou Render. A infraestrutura Laravel adicionada em seguida é descrita em [backend-inicial.md](backend-inicial.md).
