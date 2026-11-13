# Lumi — mascote e assistente de IA da AlumIA

Status: planejamento inicial; funcionalidade ainda não implementada.

Este documento registra a proposta inicial e deve evoluir com as decisões de produto e implementação. As escolhas técnicas abaixo são propostas, não recursos já disponíveis.

## Objetivo

Apresentar a plataforma de forma acolhedora e permitir que o estudante ajuste o jeito de conversar com a Lumi. O primeiro entregável será um tutorial conversacional curto; a conversa livre com IA será uma etapa posterior.

O “DNA de comunicação” representa preferências explícitas e editáveis. Na interface, usar uma expressão simples, como **Seu jeito de conversar com a Lumi**. Não representa perfil psicológico, personalidade, diagnóstico ou classificação clínica.

## Requisitos de produto

- A Lumi é identificada como mascote e assistente virtual da AlumIA.
- No primeiro acesso, inicia uma conversa de boas-vindas que apresenta a plataforma.
- A conversa é natural, acolhedora e curta, com uma pergunta por vez e possibilidade de pular.
- O estudante pode escolher como prefere conversar, respostas diretas ou detalhadas e assuntos que deseja abordar ou evitar.
- A linguagem pode se adaptar a essas escolhas, sem inferir características psicológicas.
- As preferências podem ser editadas ou limpas posteriormente.
- O progresso é salvo para retomar uma conversa interrompida e evitar repetir o tutorial a cada login.
- A Lumi não afirma conhecer completamente o estudante nem determinar sua personalidade a partir de uma conversa.

## Fluxo inicial proposto

O tutorial aparece depois da configuração de senha e frase de recuperação, dentro da área do estudante. Planejar aproximadamente quatro a seis interações, sem bloquear o acesso ao diário.

1. **Boas-vindas:** apresentar a Lumi como assistente virtual e oferecer a apresentação rápida.
2. **Orientação:** explicar o diário, o histórico e o acompanhamento pela equipe escolar, sem prometer sigilo absoluto.
3. **Preferências:** perguntar sobre tamanho das respostas, tom e assuntos de interesse ou a evitar, com respostas rápidas e opção de pular.
4. **Confirmação:** permitir revisar as escolhas e seguir para “Escrever no meu diário”.

Exemplo de abertura, sujeito a revisão:

> Oi! Eu sou a Lumi, a assistente virtual da AlumIA. Posso te mostrar como funciona por aqui e adaptar meu jeito de conversar às suas preferências. Você pode pular ou mudar isso depois.

O primeiro fluxo pode usar um roteiro determinístico, sem depender de IA generativa. Uma opção “Preferências da Lumi” permitirá editar escolhas e rever o tutorial voluntariamente.

## Dados propostos

Manter o perfil associado ao código anônimo do estudante, sem solicitar nome real, CPF ou e-mail pessoal. Preferências começam sem definição e são preenchidas apenas por escolhas explícitas.

| Informação | Valores ou finalidade |
| --- | --- |
| Tamanho das respostas | Curtas, detalhadas ou sem preferência |
| Tom | Direto, descontraído ou sem preferência |
| Assuntos de interesse | Seleção opcional; catálogo a definir |
| Assuntos a evitar | Seleção opcional; catálogo a definir |
| Estado do tutorial | Não iniciado, em andamento, concluído ou pulado |
| Etapa atual | Retomar do último avanço salvo |
| Versão do tutorial | Permitir evolução sem reiniciar automaticamente |
| Data de atualização | Registrar a última mudança |

Separar estado do tutorial e preferências. Concluir ou pular não exige responder todas as perguntas. Atualizar preferências não reinicia o tutorial.

Não extrair preferências automaticamente dos diários nem gerar rótulos como “introvertido”, “ansioso” ou “perfil de risco”. O perfil de comunicação não deve modificar indicadores ou regras clínicas, nem aparecer como avaliação nos painéis da escola ou administração.

## Integração com o projeto

Pontos observados no código durante o planejamento:

- `src/context/AppContext.jsx`: o primeiro acesso atual configura recuperação de conta. O campo `firstLogin` passa a `true` após essa configuração; ele não deve controlar o tutorial da Lumi. Redefinir a senha não deve apagar preferências nem reiniciar a apresentação.
- `src/services/storageService.js`: a persistência usa `localStorage` ou `window.storage`, e os erros de gravação atualmente são ignorados. O fluxo da Lumi deve reconhecer falhas e não confirmar como salvo algo que não foi persistido.
- `src/services/aiService.js`: a análise do diário é destinada à escola. A conversa da Lumi deve ter serviço, instruções e contexto próprios.

Organização sugerida:

| Local | Responsabilidade proposta |
| --- | --- |
| `src/components/student/lumi/` | Mascote, tutorial e editor de preferências |
| `src/constants/lumiOnboarding.js` | Mensagens, opções e etapas do roteiro |
| `src/services/lumiService.js` | Futura integração conversacional |
| `src/context/AppContext.jsx` | Ações para salvar progresso e preferências |
| `src/services/storageService.js` | Persistência e migração de registros existentes |

O armazenamento local atende ao protótipo, mas não garante continuidade entre dispositivos. A versão com sincronização precisará de persistência no servidor e controle de acesso por estudante e escola.

## Limites da assistente

- Receber apenas contexto necessário à conversa e às preferências autorizadas; não receber indicadores, classificações de risco ou sínteses clínicas do painel escolar.
- Manter orientações e análises clínicas restritas aos profissionais da escola.
- Usar formulações como “Posso ajustar meu jeito de responder”; evitar “Já entendi quem você é” e “Conheço sua personalidade”.
- Antes de liberar conversa livre, definir como lidar com situações sensíveis e explicar ao estudante a diferença entre conversar com a Lumi e enviar um diário à escola.
- Definir retenção, exclusão e acesso às conversas antes de armazená-las. Não presumir que todo diálogo será uma entrada de diário.
- Preferências de assuntos a evitar orientam a conversa; o comportamento em situações sensíveis ainda precisa ser especificado.
- A integração generativa deve passar por um backend, mantendo credenciais fora do navegador.

## Direção visual e acessibilidade

Definir a faixa etária atendida antes de fechar o desenho e o tom da mascote. A aparência deve ser acolhedora e legível, com estados iniciais de boas-vindas, aguardando resposta e confirmação.

Usar animações discretas, respeitar redução de movimento e garantir navegação por teclado e leitura por leitores de tela. A mascote não deve ser a única forma de comunicar informação ou progresso.

## Etapas de entrega

### 1. Roteiro e protótipo

- [ ] Definir faixa etária, tom e direção visual.
- [ ] Revisar mensagens, opções de preferência e quantidade de interações.
- [ ] Especificar pular, retomar, concluir e rever voluntariamente.
- [ ] Validar o protótipo em celular e com recursos de acessibilidade.

### 2. Tutorial funcional

- [ ] Implementar roteiro guiado sem dependência de IA generativa.
- [ ] Persistir cada avanço e tratar falhas de gravação.
- [ ] Definir migração e apresentação para estudantes já cadastrados.
- [ ] Disponibilizar edição e limpeza das preferências.
- [ ] Preservar progresso e preferências em redefinições de acesso.

### 3. IA conversacional

- [ ] Definir escopo das conversas, contexto enviado e comportamento em situações sensíveis.
- [ ] Definir retenção, exclusão, acesso e relação com o diário.
- [ ] Implementar backend e controles de acesso antes de conectar o modelo.
- [ ] Adaptar linguagem apenas com base nas preferências declaradas.
- [ ] Prever indisponibilidade da IA sem bloquear o diário.

### 4. Validação

- [ ] Conferir experiência móvel, teclado, leitores de tela e redução de movimento.
- [ ] Validar interrupção, retomada, preferências parciais e falha de armazenamento.
- [ ] Conferir separação entre comunicação do estudante e análise clínica da escola.
- [ ] Revisar mensagens para impedir promessas de diagnóstico ou conhecimento completo do estudante.

## Critérios de aceite do primeiro entregável

- O estudante conhece a Lumi e recebe uma orientação curta sobre a plataforma.
- Pode responder, pular perguntas ou pular o tutorial sem perder acesso ao diário.
- Pode sair e retomar da última etapa salva.
- Tutorial concluído ou pulado não reaparece automaticamente nos próximos logins.
- Pode editar ou limpar as preferências e rever a apresentação por iniciativa própria.
- Estudantes existentes recebem um estado inicial compatível, sem perda de dados.
- Nenhuma preferência produz classificação psicológica ou clínica.
- Nenhuma falha de persistência é apresentada como salvamento bem-sucedido.

## Decisões em aberto

| Tema | Próxima decisão |
| --- | --- |
| Público | Faixa etária e adequação da linguagem |
| Identidade visual | Forma, cores e expressões da Lumi |
| Preferências | Catálogo de assuntos e necessidade de texto livre |
| Estudantes existentes | Quando oferecer a apresentação pela primeira vez |
| Conversa livre | Funções disponíveis e limites do acompanhamento |
| Dados | Retenção, exclusão, permissões e sincronização |
| Situações sensíveis | Conduta da assistente e articulação com apoio escolar |
| IA | Provedor, modelo e limites operacionais, na etapa de integração |

## Histórico

- Planejamento inicial: registrado o escopo do tutorial, preferências de comunicação, limites da Lumi, proposta de arquitetura e etapas de entrega. Nenhuma funcionalidade implementada nesta etapa.

Ao avançar, atualizar os checkboxes e registrar decisões com data, motivo e impacto. Manter propostas não aprovadas identificadas como propostas.
