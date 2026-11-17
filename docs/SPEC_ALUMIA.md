# AlumIA — Especificação de evolução do site e da plataforma

> Documento de referência para planejamento, criação de issues e execução por agentes.
> Origem: roteiro consolidado fornecido pela equipe AlumIA.
> Versão: 1.1 — 17/11/2026.
> Estado: arquitetura adotada; auditoria inicial e fundação do backend documentadas, com integração do produto ainda pendente.
> Local sugerido no repositório: `docs/SPEC_ALUMIA.md`.

## Decisões e evidências atuais

- Stack adotada: React + Laravel + PostgreSQL no Supabase Free; consultar `docs/arquitetura-piloto.md`.
- Auditoria inicial: `docs/auditoria-inicial.md`; não repetir verificações já registradas sem mudança ou motivo. Completar a homologação ainda pendente.
- Fundação Laravel e testes já implementados: `docs/backend-inicial.md`. Isso não conclui as tarefas de autenticação, permissões, avaliações ou Lumi.
- API de autenticação e permissões mínimas implementada e testada: `docs/acessos-backend.md`. Conexão Supabase e integração React pendentes; isso não declara concluídas as condições operacionais de liberação.
- Esta decisão tecnológica atualiza a orientação genérica de não escolher stack antes da auditoria. Os requisitos de produto e de liberação continuam válidos.

## 1. Objetivo

Evoluir a implementação existente da AlumIA para apresentar e oferecer uma plataforma profissional de apoio socioemocional escolar, com duas experiências distintas:

1. **Lumi:** chat contínuo de acolhimento e conversa, com preferências de comunicação e regras próprias de privacidade e encaminhamento de possíveis situações de risco.
2. **Avaliação periódica:** produção de textos em períodos definidos pela escola, com análise dos 12 indicadores socioemocionais já definidos no projeto e consulta por profissionais autorizados.

A AlumIA apoia o acompanhamento e o acolhimento realizados por pessoas. Não oferece diagnóstico psicológico ou clínico e não substitui profissionais ou serviços de emergência.

## 2. Como usar esta especificação

- Ler as instruções aplicáveis do repositório, incluindo `AGENTS.md`, antes de executar qualquer tarefa.
- Consultar a auditoria ALU-001 já iniciada e completar suas pendências antes das tarefas dependentes. Respeitar a stack adotada e não presumir recursos existentes, provedor ou capacidades de IA.
- Usar os IDs `ALU-001` a `ALU-028` como referências estáveis. Os números das issues do GitHub serão diferentes.
- Criar uma issue por tarefa; dividir tarefas grandes em sub-issues com entregas verificáveis antes de iniciá-las.
- Vincular cada issue ao trecho correspondente desta especificação e registrar suas dependências.
- Tratar atribuições e sequência semanal como propostas de organização, sem presumir pessoas disponíveis ou execução simultânea.
- Registrar decisões pendentes. Agentes podem resolver escolhas técnicas rotineiras dentro do escopo, mas não inventar políticas institucionais, critérios clínicos ou aprovações humanas.
- Uma tarefa existente no código pode exigir apenas correção ou validação. A auditoria deve evitar reimplementações.

## 3. Regras obrigatórias

### 3.1 Produto e conteúdo

- Preservar funcionalidades válidas, identidade visual, conteúdos educativos, dados estatísticos e referências existentes.
- Não alterar números ou fontes bibliográficas sem validação documentada.
- Não inventar modelos, algoritmos, métricas de precisão, indicadores, qualificações da equipe ou funcionalidades disponíveis.
- Não apresentar mocks, dados fictícios ou funcionalidades simuladas como produto funcional.
- Fixtures e dados sintéticos podem ser usados em testes isolados, claramente identificados e sem aparecer como dados reais no produto.
- Explicar que os indicadores são sinais de atenção para apoiar o trabalho humano, sem prometer diagnóstico.
- Apresentar reuniões ou análises pedagógicas como recursos disponíveis somente quando efetivamente implementados.

### 3.2 Identidade, acesso e dados

- O estudante acessa por token individual fornecido pela escola.
- A escola mantém externamente a correspondência entre estudante e token; não exigir identidade direta para realizar a análise.
- O uso de token não garante anonimato absoluto. O próprio texto pode conter informações identificáveis.
- As credenciais institucionais são distintas dos tokens dos estudantes.
- Cada escola acessa somente seus próprios dados, de acordo com as permissões do profissional.
- A autorização deve ser aplicada no servidor; ocultar componentes na interface não é suficiente.
- Senhas nunca podem ser armazenadas em texto aberto ou incluídas em logs.
- Não implementar recuperação automática ou redefinição pública da senha institucional.
- Aplicar controles de acesso, proteção, rastreabilidade e políticas de retenção às duas experiências, respeitando suas diferenças.
- Não expor conteúdo sensível em logs, mensagens de erro, capturas de tela ou evidências de revisão.

### 3.3 Limites e segurança da Lumi

- O perfil salvo é de preferências de comunicação, sem classificação psicológica, clínica ou de personalidade.
- Não afirmar que a Lumi conhece completamente o estudante.
- Conversas cotidianas não são encaminhadas à escola como transcrições nem convertidas automaticamente em relatórios escolares.
- Antes do chat, explicar em linguagem adequada à idade que a conversa é reservada e possui limites de confidencialidade em situações de risco.
- Possíveis situações de risco seguem protocolo institucional documentado e avaliação humana; a IA não decide sozinha a conduta.
- Compartilhar apenas informações necessárias com responsáveis autorizados, conforme protocolo e obrigações aplicáveis.
- Não prometer monitoramento humano ininterrupto, resposta imediata ou cobertura que a operação não ofereça.
- Não liberar o chat aos estudantes antes dos controles e da operação definidos na seção 7.

## 4. Experiências e requisitos funcionais

### RF-01 — Site institucional

O site deve comunicar de forma objetiva que a AlumIA utiliza IA como apoio ao acompanhamento socioemocional escolar, analisando textos e organizando indicadores para profissionais autorizados.

O fluxo de funcionamento deve mostrar:

1. Acesso do estudante com token individual.
2. Produção de texto reflexivo em período definido pela escola.
3. Processamento do texto e identificação de possíveis padrões relacionados aos 12 indicadores existentes.
4. Organização dos resultados para profissionais autorizados.
5. Uso das informações pela equipe escolar no acompanhamento e acolhimento.

A seção de estatísticas deve ampliar a legibilidade de números, títulos, textos de apoio e referências, mantendo o conteúdo validado.

### RF-02 — Equipe

Exibir cards padronizados, preservando os nomes e cargos fornecidos:

| Integrante | Cargo |
| --- | --- |
| Tiago Maior | CEO e Idealizador da AlumIA |
| Henrique | CEO e CMO |
| Davi Lorenzo | CFO |
| Bento Cruvinel | Controller |
| Daniel Virlei | Marketing / Influenciador Interno |
| Marco Túlio | CRDO |
| Matheus | Desenvolvedor Full-Stack |
| Caio Lucas | Desenvolvedor Full-Stack |

Não acrescentar biografias, experiências ou qualificações não fornecidas.

### RF-03 — Identidade visual, acessibilidade e responsividade

- Finalizar estilos de todas as páginas e componentes identificados na auditoria.
- Padronizar tipografia, cores, tamanhos, espaçamentos, botões, cards, bordas, sombras e alinhamentos.
- Substituir emojis de interface por ícones consistentes.
- Remover referências indevidas ao Claude em textos, créditos, comentários e elementos do produto. Se uma ocorrência corresponder a uma dependência técnica real, avaliar seu uso antes de removê-la; não quebrar integrações para apagar um nome.
- Revisar navegação, hierarquia, contraste, legibilidade, foco, rótulos e uso por teclado.
- Verificar computadores, tablets e celulares, incluindo telas estreitas e ampliação de texto.
- Usar linhas do tempo, ilustrações e animações discretas somente quando ajudarem a compreensão e respeitarem preferências de redução de movimento.

### RF-04 — Autenticação do estudante e da escola

**Estudante:** preservar o acesso por token e sua associação ao fluxo estudantil. Auditar validade, persistência e comportamento de erros sem redefinir arbitrariamente o ciclo de vida do token.

**Escola:** autenticar com usuário e senha, criados pelo administrador geral. A escola não cria nem redefine publicamente suas credenciais.

Quando uma escola perder a senha:

1. A escola solicita a redefinição ao administrador geral.
2. O administrador verifica a solicitação segundo procedimento definido.
3. O administrador redefine a credencial e fornece senha temporária por canal seguro.
4. A plataforma exige troca da senha temporária no primeiro acesso, antes de liberar as demais funcionalidades.

Implementar hash seguro usando os mecanismos apropriados à stack existente, proteção contra tentativas excessivas, controle de sessão e registro das alterações de credenciais sem registrar os segredos.

A tela de login deve diferenciar os dois acessos, possuir mensagens compreensíveis, estados de carregamento e identidade visual da AlumIA. A Lumi pode aparecer sem infantilizar a interface.

### RF-05 — Tutorial e preferências de comunicação

No primeiro acesso, a Lumi conduz conversa curta e acolhedora para apresentar a plataforma e conhecer preferências: estilo de conversa, respostas diretas ou detalhadas, assuntos de interesse e assuntos a evitar.

Salvar preferências e progresso para permitir retomada e evitar repetição a cada login. Disponibilizar edição posterior. Não tratar essas informações como inferências psicológicas.

### RF-06 — Chat contínuo

- Disponível independentemente das janelas de avaliação.
- Experiência e navegação distintas da atividade de texto reflexivo.
- Apoio geral para conversar sobre rotina, escola, amizades, sentimentos e preocupações.
- Persistência e acesso às conversas conforme política definida, sem assumir retenção ilimitada.
- Comunicação clara dos limites da assistente e da confidencialidade antes do uso.
- Falhas do provedor, indisponibilidade e interrupções devem gerar feedback compreensível, sem apresentar uma análise inexistente como concluída.

### RF-07 — Risco e encaminhamento

O fluxo precisa contemplar identificação de possíveis sinais, classificação conforme critérios aprovados, encaminhamento, avaliação humana e registro do tratamento. Critérios, níveis, destinatários e prazos são decisões institucionais pendentes; este documento não estabelece critérios clínicos.

Prever situações graves, ambíguas, possível risco imediato e falha de entrega do encaminhamento. A resposta operacional deve considerar o horário real de disponibilidade dos profissionais e o funcionamento do chat fora dele.

O registro deve permitir rastrear encaminhamentos e acessos por pessoas autorizadas, preservando o mínimo necessário de informação e a política de retenção.

### RF-08 — Avaliação periódica

- Frequência inicial prevista: mensal; frequência definitiva depende de confirmação institucional.
- Perfil autorizado configura abertura e encerramento dos períodos.
- Dentro da janela, o estudante recebe a atividade e envia seu texto.
- Fora dela, novos envios são bloqueados, salvo autorização administrativa.
- O servidor valida a janela e a permissão, inclusive em chamadas diretas à API.
- O texto enviado é processado pelos 12 indicadores já definidos; não criar indicadores ou resultados substitutos.
- Profissionais autorizados consultam os resultados de sua instituição.
- O administrador acompanha períodos, participação e pendências conforme suas permissões.
- O chat permanece disponível fora da janela de avaliação, observadas suas condições de liberação.
- Antes de implementar, definir fuso dos períodos, comportamento nas fronteiras de horário, quantidade de envios por período e regras de reenvio ou correção. Não presumir essas regras.

## 5. Auditoria e arquitetura

ALU-001 deve produzir um mapa da implementação com:

- Stack, comandos de execução e verificações existentes.
- Páginas, componentes, rotas, serviços e integrações relevantes.
- Autenticação, tokens, sessões e perfis existentes.
- Armazenamento, entidades e isolamento entre escolas.
- Pipeline e definição dos 12 indicadores, incluindo localização da referência no projeto.
- Estado atual de avaliações, chat, painel administrativo e notificações.
- Inventário de conteúdos, referências e recursos visuais a preservar.
- Lacunas entre implementação e esta especificação, apoiadas em referências a arquivos.

Usar essa auditoria para propor a menor evolução coerente com o sistema existente. Não impor framework, provedor, banco ou reconstrução sem necessidade demonstrada.

A separação entre dados do chat e da avaliação deve abranger modelos, fluxos, permissões, consultas, processamento e retenção. A estratégia física de armazenamento será definida após a auditoria; não se exige, antecipadamente, um banco separado.

Alterações de schema exigem migração revisável, avaliação de compatibilidade e estratégia de recuperação. Não executar migrações destrutivas ou mudanças em produção apenas por estarem previstas no plano.

## 6. Decisões pendentes

Registrar cada decisão com responsável, data, resultado e tarefas impactadas. Os responsáveis abaixo são papéis sugeridos, a confirmar pela equipe.

| ID | Decisão | Validação necessária | Bloqueia |
| --- | --- | --- | --- |
| DEC-01 | Quem recebe sinalizações, quem age e quem cobre ausências | Gestão da escola e responsáveis pelo acompanhamento | ALU-024 e liberação do chat |
| DEC-02 | Critérios, níveis de risco e avaliação de casos ambíguos | Responsáveis institucionais e profissionais qualificados | ALU-024 e liberação do chat |
| DEC-03 | Conduta em possível risco imediato, prazos, horários e falhas de encaminhamento | Gestão e profissionais responsáveis | ALU-024 e liberação do chat |
| DEC-04 | Consentimento, transparência, retenção e exclusão, considerando menores e LGPD | Responsáveis institucionais, de privacidade e assessoria pertinente | ALU-005, ALU-009, ALU-023, ALU-025 e respectivas liberações |
| DEC-05 | Matriz de perfis e permissões de profissionais e administradores | Gestão e equipe técnica | ALU-006, ALU-010, ALU-012, ALU-018, ALU-024 |
| DEC-06 | Frequência, fuso, quantidade de envios, reenvio e exceções nas avaliações | Gestão escolar e produto | ALU-015 e ALU-016 |
| DEC-07 | Verificação do pedido de redefinição e canal seguro de entrega | Administração e equipe técnica | ALU-011 |
| DEC-08 | Capacidade semanal, responsáveis e ambiente de homologação | Equipe do projeto | Compromisso de entrega e homologação |

A definição técnica pode avançar com as pendências explicitadas. Não habilitar caminhos de produto que dependam de decisões ainda não tomadas.

## 7. Condições de liberação

### Site institucional

Conteúdo revisado, estatísticas e fontes preservadas, acessibilidade e responsividade verificadas. Funcionalidades ainda indisponíveis não podem ser anunciadas como existentes.

### Acesso institucional e avaliações

Permissões, isolamento entre escolas, autenticação, janelas e análise dos indicadores implementados e testados; políticas de dados pertinentes definidas; profissionais autorizados configurados.

### Chat da Lumi

A liberação depende de todas as condições abaixo:

- [ ] DEC-01 a DEC-05 resolvidas para o chat e registradas.
- [ ] Aviso de privacidade e limites exibido antes do início da conversa.
- [ ] Dados do chat separados dos dados da avaliação, com acesso e retenção implementados.
- [ ] Responsáveis humanos e cobertura operacional confirmados.
- [ ] Encaminhamento de risco integrado e testado, incluindo falha e indisponibilidade.
- [ ] Revisão do comportamento da Lumi e de seus limites realizada pelos responsáveis.
- [ ] Homologação final registrada pela equipe responsável.

O chat pode ser desenvolvido e validado em ambiente restrito enquanto esses itens estiverem pendentes. Sua interface pública não deve sugerir disponibilidade antes da liberação.

## 8. Organização das atribuições

Papéis descrevem responsabilidades; não pressupõem agentes já criados nem autorizam envio de mensagens a pessoas ou serviços.

| Papel | Responsabilidade principal |
| --- | --- |
| Coordenação técnica | Auditoria, dependências, contratos compartilhados, integração e revisão das evidências |
| Frontend e conteúdo | Site, login, interfaces da Lumi e avaliações, estilos e acessibilidade |
| Backend e dados | Autenticação, permissões, persistência, períodos, processamento e migrações |
| Integração de IA | Integração existente, comportamento da Lumi, indicadores e mecanismos de risco aprovados |
| Qualidade | Validação dos critérios, regressões, testes de autorização e homologação |
| Responsável institucional | Decisões operacionais, privacidade, protocolo, destinatários e aprovação de liberação |

Uma pessoa ou agente pode assumir mais de um papel. Cada issue deve ter um responsável principal e um revisor definido. Agentes não substituem a validação institucional.

Trabalho em paralelo só deve começar quando contratos compartilhados estiverem acordados. Ao dividir o trabalho, registrar arquivos ou módulos de cada frente e coordenar alterações em schema, autenticação, estilos globais e interfaces de API. Não sobrescrever mudanças de outra frente.

## 9. Backlog executável

**Prioridade:** P0 = requisito estrutural ou bloqueio de liberação; P1 = entrega principal; P2 = refinamento reagendável. Prioridade não significa que a tarefa está pronta para começar: respeitar as dependências.

Todas as tarefas começam como **Backlog**. Nenhuma foi verificada como implementada neste documento.

### ALU-001 — Auditar a implementação atual

- **Prioridade / papel:** P0 / Coordenação técnica.
- **Dependências:** nenhuma.
- **Escopo:** executar o inventário da seção 5 e mapear lacunas, riscos e recursos preservados.
- **Aceite:** relatório com referências a arquivos, comandos disponíveis, funcionalidades verificadas e pendências; tarefas seguintes ajustadas ao estado real, sem alterar o produto nesta auditoria.

### ALU-002 — Definir a matriz de acesso

- **Prioridade / papel:** P0 / Coordenação técnica e responsável institucional.
- **Dependências:** ALU-001.
- **Escopo:** resolver DEC-05, incluindo autorização por escola e por tipo de dado.
- **Aceite:** matriz aprovada com permissões de leitura, escrita e administração para chat, avaliações e encaminhamentos; restrições padrão documentadas.

### ALU-003 — Documentar o protocolo de risco

- **Prioridade / papel:** P0 / Responsável institucional, com apoio técnico.
- **Dependências:** ALU-001.
- **Escopo:** resolver DEC-01, DEC-02 e DEC-03.
- **Aceite:** protocolo validado identifica critérios, níveis, responsáveis, prazos, supervisão humana, risco imediato, indisponibilidade e falhas; sem decisões clínicas inventadas pelos agentes.

### ALU-004 — Definir políticas de tratamento de dados

- **Prioridade / papel:** P0 / Responsável institucional e responsáveis por privacidade.
- **Dependências:** ALU-001.
- **Escopo:** resolver DEC-04 para tokens, textos, resultados, preferências, conversas e encaminhamentos.
- **Aceite:** finalidades, acesso, transparência, consentimento e demais requisitos aplicáveis, retenção e exclusão definidos, com responsáveis e validação registrados.

### ALU-005 — Projetar a separação entre chat e avaliações

- **Prioridade / papel:** P0 / Backend e dados.
- **Dependências:** ALU-001, ALU-002 e ALU-004.
- **Escopo:** definir modelos, fluxos, contratos e migrações necessárias, preservando a implementação válida.
- **Aceite:** desenho técnico revisado demonstra separação de permissões, processamento, consultas e retenção; não existe fluxo automático de conversas para relatórios escolares.

### ALU-006 — Implementar a base de autorização e isolamento por escola

- **Prioridade / papel:** P0 / Backend e dados.
- **Dependências:** ALU-002 e ALU-005.
- **Escopo:** aplicar o contexto da instituição e as permissões no servidor, reaproveitando controles válidos.
- **Aceite:** testes demonstram bloqueio de acesso cruzado entre escolas e entre perfis, inclusive alterando identificadores diretamente na API.

### ALU-007 — Revisar hero, apresentação e acompanhamento pedagógico

- **Prioridade / papel:** P1 / Frontend e conteúdo.
- **Dependências:** ALU-001.
- **Escopo:** revisar proposta institucional, apoio ao trabalho humano e descrição de recursos pedagógicos.
- **Aceite:** conteúdo objetivo, sem diagnóstico, métricas inventadas ou serviços indisponíveis anunciados como existentes.

### ALU-008 — Apresentar visualmente o fluxo “Como funciona”

- **Prioridade / papel:** P1 / Frontend e conteúdo.
- **Dependências:** ALU-001 e ALU-007.
- **Escopo:** apresentar os cinco passos de RF-01 e explicar o processamento apenas com capacidades verificadas.
- **Aceite:** fluxo legível em diferentes telas, com os 12 indicadores referenciados sem inventar nomes ou capacidades.

### ALU-009 — Atualizar a comunicação de privacidade

- **Prioridade / papel:** P1 / Frontend e conteúdo, com validação institucional.
- **Dependências:** ALU-002 e ALU-004.
- **Escopo:** explicar tokens, correspondência externa, acesso autorizado e limites de confidencialidade.
- **Aceite:** textos consistentes com políticas e implementação; sem prometer anonimato ou sigilo absolutos.

### ALU-010 — Implementar autenticação institucional

- **Prioridade / papel:** P0 / Backend e dados.
- **Dependências:** ALU-001, ALU-002 e ALU-006.
- **Escopo:** credenciais criadas pelo administrador geral, hash seguro, sessões, limitação de tentativas e registro de alterações.
- **Aceite:** login válido funciona; tentativas indevidas são protegidas; sessão e autorização são verificadas; nenhum segredo aparece em logs; não há cadastro ou recuperação pública institucional.

### ALU-011 — Implementar redefinição administrativa e senha temporária

- **Prioridade / papel:** P0 / Backend e dados.
- **Dependências:** ALU-010 e DEC-07 resolvida.
- **Escopo:** permitir redefinição pelo administrador após verificação, com entrega segura e troca obrigatória.
- **Aceite:** senha temporária exige troca antes do uso normal; apenas administrador autorizado redefine; alteração é registrada sem expor senha; comportamento das sessões anteriores definido e testado.

### ALU-012 — Validar e preservar o acesso do estudante por token

- **Prioridade / papel:** P0 / Backend e dados.
- **Dependências:** ALU-001, ALU-002 e ALU-006.
- **Escopo:** verificar token, associação do estudante à instituição e permissões do fluxo.
- **Aceite:** tokens válidos e inválidos têm comportamento correto; um token não acessa dados de outro estudante ou escola; nenhuma identidade direta adicional é exigida sem decisão justificada.

### ALU-013 — Reformular a tela de login

- **Prioridade / papel:** P1 / Frontend e conteúdo.
- **Dependências:** ALU-010, ALU-011, ALU-012 e ALU-020.
- **Escopo:** integrar as duas entradas com rótulos, feedback, carregamento e fluxo de troca de senha.
- **Aceite:** estudante e escola concluem seus fluxos reais em desktop e celular; navegação por teclado e erros são compreensíveis; não há formulário de recuperação pública.

### ALU-014 — Implementar a base de dados separada das experiências

- **Prioridade / papel:** P0 / Backend e dados.
- **Dependências:** ALU-005 e ALU-006.
- **Escopo:** executar as alterações aprovadas em modelos, serviços e consultas, com migrações quando necessárias.
- **Aceite:** separação proposta existe no código e nas permissões; dados e funcionalidades válidas são preservados; migrações e recuperação são documentadas e verificadas em ambiente apropriado.

### ALU-015 — Implementar a gestão de janelas de avaliação

- **Prioridade / papel:** P1 / Backend e dados e Frontend.
- **Dependências:** ALU-006, ALU-014 e DEC-06 resolvida.
- **Escopo:** configurar abertura, encerramento e exceções por perfis autorizados.
- **Aceite:** permissões e horários são validados no servidor; fronteiras de abertura e encerramento seguem o fuso definido; alterações e exceções são rastreáveis.

### ALU-016 — Implementar a atividade e as regras de envio

- **Prioridade / papel:** P1 / Frontend e Backend.
- **Dependências:** ALU-012 e ALU-015.
- **Escopo:** apresentar a atividade e salvar o envio conforme janela, quantidade e regras de correção aprovadas.
- **Aceite:** envios fora da janela são bloqueados sem autorização; cliques repetidos não geram duplicação indevida; sucesso e falha têm feedback coerente com o resultado real.

### ALU-017 — Integrar os textos à análise dos 12 indicadores

- **Prioridade / papel:** P1 / Integração de IA e Backend.
- **Dependências:** ALU-014 e ALU-016.
- **Escopo:** integrar ou corrigir o pipeline existente e a consulta autorizada dos resultados.
- **Aceite:** os 12 indicadores correspondem à definição real do projeto; resultados são vinculados ao texto e à instituição corretos; falhas de processamento são visíveis sem resultados fabricados; reprocessamento não duplica dados indevidamente.

### ALU-018 — Criar a visão de períodos, participação e pendências

- **Prioridade / papel:** P1 / Frontend e Backend.
- **Dependências:** ALU-002, ALU-006 e ALU-016.
- **Escopo:** apresentar informações reais de avaliação conforme o perfil autorizado.
- **Aceite:** contagens e estados conferem com os registros; filtros e consultas respeitam instituição e perfil; estados vazios e de erro são tratados.

### ALU-019 — Melhorar estatísticas e cards da equipe

- **Prioridade / papel:** P2 / Frontend e conteúdo.
- **Dependências:** ALU-001 e ALU-020.
- **Escopo:** aplicar hierarquia visual às estatísticas e padronizar os oito cards de RF-02.
- **Aceite:** números e referências permanecem iguais aos validados; textos e fontes são legíveis; nomes e cargos conferem; não foram acrescentadas informações pessoais.

### ALU-020 — Consolidar estilos e componentes compartilhados

- **Prioridade / papel:** P1 / Frontend.
- **Dependências:** ALU-001.
- **Escopo:** estabelecer padrões reutilizáveis, substituir emojis e revisar referências indevidas ao Claude.
- **Aceite:** padrões estão aplicados aos componentes compartilhados; ocorrências remanescentes têm justificativa técnica; identidade e recursos funcionais são preservados; estilos de páginas restantes viram subtarefas identificadas.

### ALU-021 — Criar identidade visual e tutorial da Lumi

- **Prioridade / papel:** P2 / Frontend e conteúdo, com apoio de Integração de IA.
- **Dependências:** ALU-001 e ALU-020.
- **Escopo:** mascote, apresentação e conversa curta de boas-vindas conforme RF-05.
- **Aceite:** identidade aprovada pela equipe; apresentação acolhedora e adequada ao público, sem interrogatório ou alegações psicológicas; fluxo preparado para a persistência de ALU-022; sem exposição pública antecipada do chat.

### ALU-022 — Salvar tutorial e preferências de comunicação

- **Prioridade / papel:** P1 / Frontend e Backend.
- **Dependências:** ALU-012, ALU-014 e ALU-021.
- **Escopo:** persistir progresso, estilo de resposta, interesses e assuntos a evitar, com edição posterior.
- **Aceite:** tutorial pode ser retomado sem reinício indevido; não reaparece após conclusão; preferências podem ser atualizadas e são acessíveis somente conforme a matriz aprovada.

### ALU-023 — Implementar o chat contínuo da Lumi

- **Prioridade / papel:** P1 / Integração de IA, Backend e Frontend.
- **Dependências:** ALU-003, ALU-004, ALU-014 e ALU-022.
- **Escopo:** integrar conversa real, persistência, adaptação de linguagem e navegação separada da avaliação.
- **Aceite:** funciona independentemente das janelas; histórico segue permissões e retenção; não gera relatório escolar automaticamente; falhas são tratadas; limites da assistente são respeitados em cenários revisados.
- **Restrição:** desenvolver em ambiente restrito; liberação aos estudantes depende de ALU-024, ALU-025 e ALU-028.

### ALU-024 — Implementar sinalização e encaminhamento de risco

- **Prioridade / papel:** P0 / Integração de IA e Backend, com responsável institucional.
- **Dependências:** ALU-002, ALU-003, ALU-004, ALU-006 e ALU-014; integração final com ALU-023.
- **Escopo:** implementar o protocolo aprovado, revisão humana, acesso mínimo, registros e comportamento de falhas.
- **Aceite:** cenários aprovados de risco, ambiguidade, indisponibilidade e falha de entrega seguem o protocolo; destinatários e permissões estão corretos; registros permitem acompanhamento sem exposição indevida.

### ALU-025 — Aplicar avisos, retenção e exclusão de dados

- **Prioridade / papel:** P0 / Backend e Frontend, com validação de privacidade.
- **Dependências:** ALU-004, ALU-009 e ALU-014; integração final com ALU-023 e ALU-024.
- **Escopo:** aplicar políticas às categorias de dados e apresentar avisos adequados antes do uso do chat.
- **Aceite:** retenção e exclusão operam conforme regras aprovadas, inclusive exceções documentadas; avisos correspondem ao comportamento real; acesso e operações pertinentes são rastreáveis sem revelar segredos.

### ALU-026 — Finalizar acessibilidade, estilos e responsividade

- **Prioridade / papel:** P1 / Frontend e Qualidade.
- **Dependências:** ALU-007, ALU-008, ALU-009, ALU-013, ALU-018, ALU-019 e ALU-020; incluir ALU-021 a ALU-025 quando o chat integrar a entrega.
- **Escopo:** revisar todas as páginas e componentes da versão candidata, corrigindo estilos provisórios e regressões.
- **Aceite:** checklist de telas revisado; navegação, teclado, foco, rótulos, contraste, fontes e redução de movimento verificados; sem overflow ou perda de ações nos tamanhos testados.

### ALU-027 — Executar a validação funcional e de autorização

- **Prioridade / papel:** P0 / Qualidade e responsáveis técnicos.
- **Dependências:** tarefas implementadas que compõem a versão candidata.
- **Escopo:** executar a matriz da seção 11 e os checks adequados do repositório.
- **Aceite:** resultados e evidências registrados; falhas viram correções vinculadas; cada funcionalidade incluída tem integração verificada; nenhuma funcionalidade pendente é apresentada como aprovada.

### ALU-028 — Homologar e preparar a liberação

- **Prioridade / papel:** P0 / Coordenação técnica e responsável institucional.
- **Dependências:** ALU-026 e ALU-027, mais todas as tarefas obrigatórias do escopo liberado.
- **Escopo:** revisar condições da seção 7, configuração, migrações, plano de recuperação e documentação operacional.
- **Aceite:** escopo e limitações registrados; responsáveis validam a operação; decisões pertinentes resolvidas; condições de liberação atendidas. Funcionalidades excluídas da entrega continuam indisponíveis e registradas como pendentes.
- **Restrição:** esta especificação não autoriza, por si só, publicação ou alterações em produção.

## 10. Sequência sugerida para a primeira semana

Não considerar as 28 tarefas como compromisso de cinco dias. A capacidade e o estado do código precisam ser definidos em DEC-08. Revisar a seleção após ALU-001.

| Dia | Foco sugerido | Resultado esperado |
| --- | --- | --- |
| Segunda | ALU-001; iniciar ALU-002, ALU-003 e ALU-004 | Diagnóstico, responsáveis e decisões encaminhadas |
| Terça | ALU-007, ALU-008 e ALU-020; ALU-005 quando desbloqueada | Conteúdo e componentes evoluídos; desenho técnico revisável |
| Quarta | ALU-006 e início de ALU-010/ALU-012, respeitando dependências | Base de autorização e acessos em validação |
| Quinta | Continuidade dos acessos; ALU-011 e ALU-014 quando prontas | Fluxos e persistência integrados dentro da capacidade real |
| Sexta | Testar o escopo efetivamente implementado, revisar e replanejar | Entregas verificadas e próximo ciclo definido |

Depois, priorizar o fluxo completo de avaliações, do período ao resultado, e desenvolver a Lumi em frente própria quando as decisões e a base técnica estiverem prontas. Melhorias visuais independentes podem avançar em paralelo se houver equipe e coordenação dos arquivos compartilhados.

## 11. Matriz mínima de validação

Usar as ferramentas e convenções existentes. Automatizar regras críticas e regressões relevantes; para conteúdo e aparência, revisão manual documentada pode ser suficiente. Não criar testes que apenas repitam detalhes da implementação.

| Área | Cenários essenciais |
| --- | --- |
| Token | Válido, inválido, associação correta, tentativa de acesso a outro estudante e outra escola |
| Escola | Credencial válida e inválida, excesso de tentativas, sessão expirada/encerrada, redefinição administrativa e troca obrigatória |
| Permissões | Leitura e escrita proibidas por perfil; acesso cruzado por ID, listagem, resultado e encaminhamento |
| Avaliação | Antes, durante e depois da janela; fronteiras de horário; exceção; envio repetido; regras de reenvio; falha e retomada do processamento |
| Indicadores | Uso da definição real dos 12 indicadores, associação correta e estados de processamento sem resultados inventados |
| Painel | Períodos, participação e pendências conferem com dados autorizados |
| Tutorial | Primeiro acesso, interrupção, retomada, conclusão, novo login e alteração de preferências |
| Chat | Persistência, separação da avaliação, uso fora da janela, indisponibilidade do provedor e restrição do histórico |
| Risco | Casos aprovados, ambiguidades, avaliação humana, informação mínima, destinatário incorreto bloqueado, falha de entrega e ausência de cobertura |
| Dados | Avisos antes do uso, retenção, exclusão, exceções e registros conforme política |
| Interface | Links, formulários, estados vazios, erro e carregamento; teclado; foco; contraste; telas e ampliação de texto |
| Regressão | Recursos existentes preservados; números, referências, nomes e cargos conferidos |

Falhas e limitações de mecanismos de IA precisam ser registradas. Passar por exemplos de teste não comprova identificação perfeita de risco nem precisão clínica.

## 12. Protocolo de execução para agentes

### Antes de começar

1. Ler instruções do repositório, esta especificação, issue e decisões relacionadas.
2. Confirmar status das dependências e inspecionar o código relevante.
3. Registrar escopo, arquivos prováveis e forma de validar. Comunicar conflitos com trabalho já em curso.
4. Se faltar uma decisão institucional, registrar o bloqueio e avançar somente nas partes independentes.

### Durante a implementação

1. Trabalhar em uma issue ou sub-issue delimitada por vez, preservando alterações alheias.
2. Reutilizar padrões e serviços existentes; evitar refatorações não necessárias à entrega.
3. Coordenar mudanças em contratos, schema, autenticação e componentes compartilhados.
4. Não introduzir dependências, provedores ou mudanças de arquitetura sem justificativa técnica registrada.
5. Manter segredos fora do código e das evidências. Usar configuração apropriada ao ambiente.
6. Não modificar critérios de aceite apenas para declarar uma implementação parcial como concluída.

### Ao entregar

Registrar na issue ou PR:

```markdown
## Referência
ALU-XXX — Título

## Resultado
O que mudou e qual comportamento foi entregue.

## Validação
- Comandos executados e resultado.
- Cenários manuais verificados, quando aplicáveis.
- Critérios de aceite atendidos.

## Impactos
Migrações, configuração, permissões e documentação afetadas.

## Pendências ou bloqueios
O que ainda falta, incluindo decisões e tarefas relacionadas.
Se não houver, registrar “Nenhum identificado”.
```

Não declarar testes como executados se apenas foram sugeridos. Não declarar aprovação humana sem registro da pessoa responsável.

## 13. Critério de conclusão

Uma tarefa só pode ser concluída quando:

- [ ] Escopo implementado e integrado ao fluxo real.
- [ ] Critérios de aceite atendidos e evidenciados.
- [ ] Checks pertinentes executados, sem falhas não resolvidas no escopo.
- [ ] Permissões e isolamento verificados quando houver acesso a dados.
- [ ] Interfaces revisadas quando houver mudanças visuais.
- [ ] Migrações, configuração e documentação atualizadas quando necessárias.
- [ ] Nenhum mock apresentado como funcionalidade real.
- [ ] Revisão concluída e bloqueios impeditivos resolvidos.

Implementação concluída e liberação em produção são estados distintos. Manter explícitas as condições de liberação ainda pendentes.

## 14. Configuração sugerida do GitHub Projects

- **Status:** Backlog → Pronto para iniciar → Em andamento → Em revisão → Concluído.
- **Prioridade:** P0, P1, P2.
- **Responsável:** pessoa que conduz a entrega.
- **Área:** Coordenação, Institucional, Interface, Autenticação, Dados, Avaliações, Lumi, Privacidade ou Qualidade.
- **Semana:** ciclo de execução acordado.
- **Dia planejado:** previsão opcional.
- **Bloqueios:** dependências e decisões pendentes na descrição ou nos recursos de relacionamento disponíveis.

Convenção sugerida de título: `[ALU-015] Implementar a gestão de janelas de avaliação`.

Não mover uma tarefa para “Pronto para iniciar” sem escopo e dependências resolvidos. Uma tarefa bloqueada deve informar o bloqueio e quem pode resolvê-lo.

Modelo de issue:

```markdown
## Referência
docs/SPEC_ALUMIA.md — ALU-XXX

## Objetivo
Problema e comportamento esperado.

## Escopo
- [ ] Entrega delimitada.

## Critérios de aceite
- [ ] Resultado verificável.

## Dependências e decisões
- Issues e IDs DEC pertinentes.

## Validação prevista
Checks e cenários relevantes.

## Coordenação
Responsável, revisor e módulos compartilhados afetados.
```

## 15. Instrução inicial para um agente executor

```text
Leia as instruções do repositório e docs/SPEC_ALUMIA.md.
Trabalhe na tarefa ALU-XXX, respeitando suas dependências e decisões.
Inspecione a implementação atual antes de propor mudanças.
Não reconstrua funcionalidades válidas nem invente políticas ou capacidades.
Registre bloqueios e avance somente nas partes independentes.
Implemente o escopo delimitado, execute as verificações pertinentes e
entregue um resumo com evidências, impactos e pendências.
Não publique nem execute mudanças em produção sem autorização específica.
```

Para a primeira execução, selecionar **ALU-001**. O resultado esperado é a auditoria documentada e o refinamento do backlog, sem implementação de novas funcionalidades nessa etapa.
