# ALUMIA - Plataforma de Bem-Estar Escolar com IA

Plataforma de apoio ao acompanhamento socioemocional escolar. O React padrão usa a API Laravel para acessos; avaliações e IA do piloto estão em construção. A demonstração antiga permanece em modo separado. Não oferece diagnóstico nem substitui profissionais.

---

## Planejamento do produto

- [Especificação consolidada](docs/SPEC_ALUMIA.md): requisitos, tarefas ALU, dependências e critérios de aceite para os agentes.
- [Arquitetura do piloto](docs/arquitetura-piloto.md): React + Laravel + Supabase Free, orçamento e condições de hospedagem.
- [Backend inicial](docs/backend-inicial.md): instalação, conexão PostgreSQL/Supabase e verificações.
- [Acessos do backend](docs/acessos-backend.md): autenticação institucional, tokens de estudantes, permissões e contrato da API.
- [Supabase do piloto](docs/supabase-piloto.md): projeto existente, configuração privada e verificação segura da conexão.
- [Auditoria inicial](docs/auditoria-inicial.md): implementação existente, lacunas e limites da validação.
- [Lumi — mascote e assistente de IA](docs/planejamento-lumi.md): proposta inicial, etapas de implementação, critérios de aceite e decisões em aberto.

---

## 🚀 Tecnologias

- **React 18**
- **Vite**
- **Recharts** (Gráficos e visualização de dados)
- **Sessões no servidor** e API de mesma origem; armazenamento local apenas na demonstração
- **Laravel 13 / PHP 8.3+** em `backend/`, integrado ao React nos fluxos de acesso.
- **PostgreSQL**, com configuração preparada para schema privado no Supabase.

---

## Integração e execução

Veja [React + Laravel](docs/integracao-react.md) para executar a aplicação integrada. O backend precisa de configuração privada do banco; a integração Supabase do Codex não configura o Laravel automaticamente.

## 🔑 Acessos de Demonstração (Demo)

O projeto já vem com dados de exemplo pré-carregados para facilitar testes e apresentações:

**Somente demonstração:** esses acessos são verificados no navegador e não podem ser usados para coletar dados reais de estudantes. Eles não são contas criadas no novo backend.

| Perfil | Identificador / E-mail | Senha / Token | O que permite testar |
| :--- | :--- | :--- | :--- |
| **Administrador** | `admin@alumia.com` | `admin123` | Gerenciar escolas, gerar novos tokens, estatísticas globais (sem acesso a dados sensíveis de alunos) |
| **Escola (Gestor / Psicólogo)** | Token: `ESC-2025-ALUMIA` | *(somente token)* | Painel da escola, alertas críticos, gráficos de evolução histórica, textos completos de alunos anônimos, cadastro de novos alunos |
| **Aluno** | Código: `TURMA3A-01` | `1234` | Diário semanal, histórico de análises, escrita de novos textos com análise emocional |

*Nota: Você também pode criar novas escolas, novos alunos e novas entradas diretamente pelas telas do sistema.*

---

## 🛠️ Como Rodar Localmente

1. Clone o repositório ou acesse a pasta do projeto:
   ```bash
   npm install
   ```

2. Inicie o servidor de desenvolvimento:
   ```bash
   npm run dev:demo
   ```

3. Abra o navegador no endereço indicado (normalmente `http://localhost:5173`).

---

## Publicação

O workflow de GitHub Pages executa `npm run build:demo`, publicando somente a demonstração estática identificada. O piloto usa React e Laravel na mesma origem, conforme [arquitetura adotada](docs/arquitetura-piloto.md); sua hospedagem ainda precisa ser preparada. Não publicar o build do piloto como site estático isolado.
