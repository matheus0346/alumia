# ALUMIA - Plataforma de Bem-Estar Escolar com IA

Plataforma educacional para identificação precoce de sofrimento emocional em estudantes de forma anônima, segura e em conformidade com a LGPD (Lei 13.709/2018).

---

## 🚀 Tecnologias

- **React 18**
- **Vite**
- **Recharts** (Gráficos e visualização de dados)
- **Persistência Local (LocalStorage)** com suporte ao ecossistema Claude Artifacts

---

## 🔑 Acessos de Demonstração (Demo)

O projeto já vem com dados de exemplo pré-carregados para facilitar testes e apresentações:

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
   npm run dev
   ```

3. Abra o navegador no endereço indicado (normalmente `http://localhost:5173`).

---

## 🌐 Como Hospedar no GitHub Pages

Este repositório já possui uma automação configurada via **GitHub Actions** em `.github/workflows/deploy.yml`.

1. Suba o código para o seu repositório no GitHub:
   ```bash
   git add .
   git commit -m "feat: initial commit Alumia"
   git branch -M main
   git remote add origin https://github.com/SEU_USUARIO/alumia.git
   git push -u origin main
   ```
2. No GitHub, acesse a aba **Settings** do seu repositório.
3. No menu lateral esquerdo, clique em **Pages**.
4. Em **Build and deployment > Source**, selecione **GitHub Actions**.
5. Pronto! Em cerca de 1 a 2 minutos o site estará online no endereço:
   `https://SEU_USUARIO.github.io/alumia/`

---

## ⚡ Como Hospedar na Vercel (Alternativa em 1 clique)

1. Acesse [vercel.com](https://vercel.com) e faça login com sua conta do GitHub.
2. Clique em **Add New... > Project**.
3. Selecione o repositório `alumia` e clique em **Deploy**.
4. O Vercel detecta o Vite automaticamente e publica em segundos!
