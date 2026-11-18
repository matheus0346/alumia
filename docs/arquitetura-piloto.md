# AlumIA — Decisão de arquitetura e plano de hospedagem do piloto

Data: 17/11/2026.

Estado: React + Laravel + PostgreSQL no Supabase Free adotados para o projeto; hospedagem no Render Free proposta para validação técnica. Nenhum serviço foi provisionado por este documento.

## 1. Contexto e objetivo

A equipe realizará um piloto com aproximadamente 30 estudantes e não dispõe de orçamento para infraestrutura neste momento. O mantenedor também deseja adquirir experiência prática em PHP e demonstrá-la em seu portfólio.

A inspeção estática da cópia local do repositório, no commit `4d03e8edc4435158be3536eb02a5c9bdacc34491`, encontrou:

- Frontend React 18, JavaScript/JSX, Vite e Recharts.
- Regras, login e estado executados no navegador, sem backend de aplicação no repositório.
- Persistência via `localStorage`, com alternativa para `window.storage` e inicialização com dados de demonstração.
- Escola acessando por token e estudante por código e senha, diferentes do fluxo solicitado no roteiro consolidado.
- Diário semanal, painéis e definição dos 12 indicadores presentes no código.
- Chamada opcional à Anthropic a partir do navegador e fallback de análise por regras locais.
- Lumi registrada como planejamento, sem chat contínuo implementado.
- Workflow de publicação estática no GitHub Pages.

Essa inspeção não executou a aplicação, não comprovou a chamada de IA e não substitui a auditoria funcional ALU-001. Não foram identificados testes automatizados no inventário consultado.

## 2. Decisões adotadas

| Tema | Decisão |
| --- | --- |
| Frontend | Preservar React e os componentes aproveitáveis. Não reescrever a interface em PHP. |
| Backend | Implementar PHP com Laravel, responsável pelas regras, API, autenticação e autorização. |
| Banco | Usar PostgreSQL gerenciado pelo Supabase, inicialmente no plano Free. |
| Autenticação | Centralizar no Laravel; não adotar Supabase Auth nesta etapa. |
| Acesso aos dados | Navegador chama Laravel; Laravel acessa PostgreSQL. |
| Integração de IA | Executar no backend, com credenciais somente no servidor. |
| Dados reais | Não usar `localStorage` como banco de estudantes, textos ou credenciais. |
| Orçamento | Custo recorrente contratado de infraestrutura igual a zero no início; sem upgrades ou excedentes pagos automáticos. |
| Primeiro escopo | Acessos, permissões, avaliações por texto e consulta autorizada pela escola. |

PHP passa a compor o núcleo funcional: autenticação, políticas de acesso, validações, persistência, migrações, integração de IA e testes. Não deve ser apenas uma camada de encaminhamento sem responsabilidade de domínio.

O Supabase oferece integração documentada com Laravel/PostgreSQL. Não é necessário consumir sua API de dados para utilizar seu banco: [guia oficial](https://supabase.com/docs/guides/getting-started/quickstarts/laravel).

## 3. Arquitetura proposta para custo zero

```text
Navegador do estudante ou profissional
                  |
                HTTPS
                  |
       Render Free: um Web Service Docker
       +----------------------------------+
       | Arquivos estáticos do React      |
       | Laravel: /api e autenticação     |
       +----------------------------------+
                  |
             PostgreSQL via TLS
                  |
          Supabase Free / PostgreSQL

Laravel --> Serviço de IA
            Provedor e viabilidade sem gasto ainda pendentes
```

### 3.1 Hospedagem candidata: Render Free

Propor um único Web Service Docker, contendo Laravel e o build estático do React. O Render suporta deploy de Dockerfiles, inclusive para PHP: [documentação Docker](https://render.com/docs/docker).

Limites relevantes documentados do Free:

- Suspende após 15 minutos sem tráfego; o retorno pode levar cerca de um minuto.
- Arquivos locais são efêmeros e podem desaparecer em suspensão, reinício ou deploy.
- Há 750 horas mensais compartilhadas por workspace, além de limites de banda e build.
- Tráfego elevado iniciado pelo serviço, inclusive para banco externo e APIs, pode causar suspensão.
- Worker como serviço separado não tem instância Free; também não há shell interativo nesse plano.
- Excedentes podem gerar cobrança quando há método de pagamento; sem ele, há suspensão ou bloqueio conforme o limite.
- O próprio fornecedor não recomenda instâncias Free para produção.

Fonte: [Render — Deploy for Free](https://render.com/docs/free).

Consequência para a AlumIA: Render Free é candidato a homologação e piloto controlado, sujeito a testes e aceitação explícita de suas limitações pela equipe responsável. Não representa disponibilidade contínua nem infraestrutura homologada para acompanhamento crítico.

Não usar mecanismos artificiais para manter o serviço acordado como requisito de funcionamento. Se os limites impedirem o piloto, interromper a liberação e reavaliar a hospedagem; não habilitar cobrança automaticamente.

### 3.2 React e Laravel na mesma origem

Recomenda-se que ambos sejam acessados pelo mesmo domínio gratuito fornecido pelo Render, preservando a aplicação React existente. O servidor deve entregar arquivos estáticos e encaminhar `/api` e autenticação ao Laravel.

Isso evita depender, no piloto, de cookies entre `github.io` e `onrender.com` ou de um domínio próprio pago. Usar sessões e cookies protegidos, com CSRF e atributos definidos conforme a integração; não salvar tokens de sessão em `localStorage` por conveniência.

Não usar `vite dev` nem `php artisan serve` como servidor público da versão implantada. O container precisa de um servidor HTTP apropriado, configuração de porta e processo de inicialização revisados.

O GitHub Pages pode continuar apresentando conteúdo institucional estático, se desejado. O fluxo autenticado do piloto deve apontar para a aplicação integrada, sem manter duas versões concorrentes da plataforma.

### 3.3 PostgreSQL no Supabase Free

O Free oferece atualmente 500 MB de banco, CPU compartilhada, 500 MB de RAM e 5 GB de egress. Projetos podem pausar após uma semana de inatividade. Fonte: [preços e limites do Supabase](https://supabase.com/pricing).

Avaliação de capacidade: 30 alunos com textos e indicadores parecem compatíveis com um piloto pequeno, mas isso é uma estimativa, não um benchmark. Mensagens, índices, sessões, logs e uso simultâneo influenciam o consumo. A ausência de uso entre aplicações mensais pode causar pausa.

Usar conexão TLS, com `sslmode=require` no mínimo, e validar o certificado conforme os recursos do driver. A documentação recomenda o Session Pooler para redes somente IPv4 e um schema próprio para as tabelas Laravel: [Laravel e Supabase](https://supabase.com/docs/guides/getting-started/quickstarts/laravel).

Configuração proposta:

- Schema da aplicação, por exemplo `alumia`, fora dos schemas expostos pela Data API.
- Data API desabilitada se nenhum recurso a utilizar, com privilégios revisados: [proteção da API](https://supabase.com/docs/guides/api/securing-your-api).
- Credencial de execução com os menores privilégios necessários; credencial de migração mantida separadamente quando viável.
- Isolamento por escola garantido pelo Laravel e verificado com testes. A conexão direta ao banco não recebe automaticamente o contexto do usuário da sessão Laravel para políticas RLS.
- Nenhuma credencial de banco, chave administrativa ou senha no frontend, repositório ou logs.
- Migrações versionadas; não depender de alterações manuais não registradas no dashboard.

## 4. Infraestrutura gratuita não garante IA gratuita

O orçamento zero também se aplica à inferência. Supabase e Render não fornecem, por essa arquitetura, créditos ilimitados para análise de textos ou conversas.

Antes de habilitar IA para estudantes, definir:

1. Provedor, modelo e origem da capacidade de inferência sem cobrança.
2. Adequação do tratamento dos textos e condições de uso para o público e o contexto do projeto.
3. Limites de tamanho, chamadas, concorrência, retenção e consumo.
4. Comportamento para falta de quota, timeout e indisponibilidade.

Créditos promocionais têm duração e condições próprias; não contar com eles como garantia permanente. Não hospedar um modelo pesado dentro do container gratuito sem demonstrar viabilidade.

Se não houver inferência viável dentro do orçamento, os testes técnicos podem validar cadastro, acesso e envio. A atividade precisa informar que a análise está pendente ou indisponível, sem apresentar pontuações fictícias ou o fallback atual como análise validada. A liberação do fluxo de avaliação completo permanece bloqueada até sua integração real.

## 5. Escopo do piloto

### Incluir na primeira entrega

- Administrador criando credenciais institucionais.
- Login da escola com usuário e senha, troca obrigatória de senha temporária e redefinição somente administrativa.
- Acesso estudantil com token individual conforme o roteiro consolidado, com transição explícita a partir do código/senha atual.
- Vínculos e permissões por instituição, validados no servidor.
- Configuração das janelas de avaliação e suas exceções autorizadas.
- Envio e persistência de texto no banco central.
- Estados claros de recebimento, processamento, conclusão e falha.
- Resultados reais dos 12 indicadores somente quando a integração estiver disponível e verificada.
- Consulta por profissionais autorizados e visão de participação e pendências.

### Não liberar na primeira entrega

- Chat contínuo da Lumi antes de protocolo de risco, operação humana e controles de dados implementados e homologados.
- Relatórios ou sinais apresentados como diagnóstico clínico.
- Dados demonstrativos misturados com dados dos participantes.
- Recuperação pública de senha institucional.
- Uploads e anexos, salvo necessidade posteriormente definida.

O fato de serem apenas 30 alunos não reduz os requisitos de autorização e proteção dos dados. Manter as decisões institucionais da especificação de produto como condições de liberação, inclusive consentimento, transparência, retenção e exclusão pertinentes. Escolher região de hospedagem e condições de tratamento com os responsáveis; este registro não declara conformidade legal automática.

## 6. Persistência, processamento e operação

### Persistência

- Guardar dados duráveis no PostgreSQL, inclusive sessões quando aplicável.
- Usar arquivos locais apenas como temporários; não armazenar banco SQLite, backups únicos ou dados de alunos no container.
- Não registrar o conteúdo integral dos textos em logs técnicos.
- Inicialização de produção sem credenciais padrão e sem seed automático de demonstração.
- Não importar automaticamente o conteúdo do armazenamento dos navegadores; avaliar origem e necessidade antes de qualquer migração.

### Processamento

O orçamento atual não prevê um worker dedicado sempre ativo. Não presumir que tarefas disparadas após a resposta HTTP terminarão em um serviço que pode dormir.

Na implementação inicial, decidir entre processamento síncrono com timeout delimitado ou execução de jobs persistidos em uma rotina cuja disponibilidade tenha sido demonstrada. Registrar essa escolha antes de integrar IA. Tarefas pendentes devem continuar identificáveis após reinício; repetições precisam ser idempotentes.

Usar idempotência no envio e tratar o texto como recebido somente após confirmação do banco. Falha de IA não deve apagar o texto já recebido nem inventar resultados. Não depender de scheduler, cron ou worker gratuito que ainda não exista.

### Backup e recuperação

Para projetos Free, o Supabase recomenda exportações regulares e cópias externas: [backups do Supabase](https://supabase.com/docs/guides/platform/backups).

Proposta operacional: backup protegido após cada aplicação do piloto e antes de migrações, com frequência revista conforme o volume. Definir responsável, destino, retenção e acesso antes do uso real. Não salvar dumps em Git nem como artefatos públicos. Testar a restauração em ambiente isolado.

Se uma rotina automática não estiver disponível, documentar a execução manual e o responsável. Não declarar backup automático apenas porque o banco é gerenciado.

## 7. Sequência de implementação

| Etapa | Entrega verificável | Relação com a spec |
| --- | --- | --- |
| 1 | Completar auditoria e registrar lacunas; confirmar versões suportadas de PHP/Laravel e dependências compatíveis | ALU-001 |
| 2 | Criar projeto Supabase Free, schema e configuração de conexão; validar o acesso sem divulgar segredos | ALU-005 / ALU-014 |
| 3 | Estruturar Laravel no repositório, preservando React; migrations e API mínima | ALU-005 / ALU-014 |
| 4 | Implementar autenticação, tokens, políticas e isolamento entre escolas | ALU-002 / ALU-006 / ALU-010 a ALU-013 |
| 5 | Homologar Docker e uma instância Render Free com dados sintéticos; validar mesma origem e reinício | Infraestrutura do piloto |
| 6 | Entregar janelas, envio e consulta entre dispositivos | ALU-015 / ALU-016 / ALU-018 |
| 7 | Resolver viabilidade de IA sem gasto e integrar análise real | ALU-017 |
| 8 | Validar fluxo completo, limites, recuperação e decisões institucionais antes dos estudantes | ALU-025 a ALU-028 |

Os IDs ALU referem-se à especificação consolidada `SPEC_ALUMIA.md`, cujo destino sugerido é `docs/SPEC_ALUMIA.md`. Se ainda não estiver versionada, adicioná-la em tarefa própria; este documento não presume que esse arquivo já exista no repositório.

Proposta de estrutura: conservar o frontend na organização atual e adicionar `backend/` para Laravel, evitando mover todos os arquivos sem necessidade. O Dockerfile e o pipeline podem construir as duas partes sem converter o frontend para outro framework.

As etapas são sequenciais por dependência, sem promessa de conclusão em uma semana. Não criar serviços pagos, realizar deploy ou executar migrações em ambiente real apenas porque estão previstos aqui.

## 8. Checklist antes do piloto com estudantes

- [ ] Plano Free e condições efetivas de cada conta confirmados; nenhuma cobrança automática contratada.
- [ ] Região dos serviços, responsáveis operacionais e condições de dados definidos.
- [ ] Mecanismo de autenticação e transição dos tokens documentados e testados.
- [ ] Escola A não consegue ler nem alterar dados da escola B, inclusive por chamadas diretas à API.
- [ ] Texto enviado em um dispositivo aparece para o profissional autorizado em outro.
- [ ] Janelas e exceções são aplicadas no servidor.
- [ ] Dados sobrevivem a reinício e novo deploy; sessões têm o comportamento definido.
- [ ] Primeira requisição após inatividade possui feedback compreensível, sem perda ou duplicação de envio.
- [ ] Carga aproximada de 30 sessões e envios simultâneos ensaiada com dados sintéticos, sem extrapolar quotas.
- [ ] Banco indisponível, timeout de IA e falta de quota não geram confirmação ou resultados falsos.
- [ ] Restauração de backup demonstrada e responsável registrado.
- [ ] Quotas e avisos dos provedores têm responsável por acompanhamento.
- [ ] Integração real de IA e orçamento resolvidos para liberar avaliações com análise.
- [ ] Políticas pertinentes, profissionais autorizados e encaminhamentos humanos da avaliação definidos.
- [ ] Conteúdo de portfólio usa apenas dados sintéticos e evidências sem informações de participantes.
- [ ] Lumi não está disponível publicamente antes das condições específicas de liberação.

## 9. Decisões que permanecem abertas

| Tema | Situação / próximo passo |
| --- | --- |
| Render Free | Hospedagem candidata, ainda sem provisionamento ou validação de carga, latência e condições da conta |
| IA sem orçamento | Resolver provedor e capacidade antes de liberar a análise real |
| Processamento e jobs | Definir execução compatível com suspensão e sem worker pago |
| Versões e container | Fixar versões suportadas após conferir compatibilidade |
| Token estudantil | Definir emissão, validade, armazenamento seguro, recuperação e transição |
| Políticas e operação | Resolver as decisões DEC da spec pertinentes à entrega |
| Backup | Definir responsável, armazenamento protegido e política de retenção |

## 10. Critérios para revisar esta arquitetura

Reavaliar hospedagem e capacidade antes de ampliar o piloto, ou se ocorrerem pausas incompatíveis com as atividades, perda de disponibilidade, esgotamento de quotas, crescimento de dados ou necessidade de processamento contínuo.

Reavaliar a oferta de chat caso a operação exija prontidão que a infraestrutura e a equipe não consigam fornecer. Uma mudança de plano requer orçamento e decisão explícitos; não é automática.

Portabilidade desejada: banco PostgreSQL padrão, migrations versionadas e backend Laravel empacotado em Docker. Isso facilita trocar de provedor sem mudar o domínio do produto.

## 11. Orientação aos agentes

Ler as instruções do repositório, esta decisão, a especificação consolidada e a issue atribuída. Este registro define a escolha tecnológica e a restrição de custo zero; a spec continua definindo o comportamento do produto.

- Não trocar PHP/Laravel por Node.js por preferência do agente.
- Não reescrever React para cumprir a adoção de PHP.
- Não conectar o frontend diretamente às tabelas sensíveis para contornar o backend.
- Não colocar segredos em variáveis `VITE_*` ou no bundle.
- Não presumir que a camada gratuita inclui IA, worker permanente, backup automático ou disponibilidade contínua.
- Não considerar as decisões institucionais resolvidas pela escolha da stack.
- Registrar alternativas se houver incompatibilidade real e levar a decisão à equipe antes de mudar a arquitetura adotada.
- Não alterar os planos contratados nem publicar sem autorização específica.

## 12. Fontes e validade

Condições de planos consultadas em 17/11/2026. Podem mudar; reconferir antes de provisionar e antes do piloto.

- [Render Free](https://render.com/docs/free)
- [Docker no Render](https://render.com/docs/docker)
- [Supabase Free e limites](https://supabase.com/pricing)
- [Laravel e Supabase](https://supabase.com/docs/guides/getting-started/quickstarts/laravel)
- [Proteção da Data API](https://supabase.com/docs/guides/api/securing-your-api)
- [Backup e recuperação](https://supabase.com/docs/guides/platform/backups)
