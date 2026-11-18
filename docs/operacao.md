# Operação e recuperação

Procedimentos adotados em 18/11/2026. Estado atual: somente CI e publicação manual da demonstração estão implementadas. Container, hospedagem do piloto, backup e recuperação ainda precisam de implementação e ensaio. Não executar procedimentos de produção como testes.

## Publicar a demonstração no Pages

Após estes workflows serem incorporados à main:

1. Confirmar que o commit desejado está na main, revisar o diff e obter autorização específica de publicação.
2. Em Actions, selecionar Publish demonstration to GitHub Pages, Run workflow e branch main.
3. Aguardar a CI completa, o build e o deploy. Somente o artefato marcado como demo pode ser publicado. Não executar outro deploy em paralelo.
4. Conferir URL pública, aviso de demonstração e carregamento de recursos. Registrar SHA, URL, resultado e responsável no PR ou em uma issue de entrega, sem segredos.
5. Se houver falha, manter a execução e os logs para investigação. Não contornar os checks. Para recuperar conteúdo anterior, preparar PR de reversão, validar e publicar manualmente a nova main. Não fazer force push para voltar a branch.

Este fluxo não publica Laravel e não aplica migrações. Publicar o Pages não é um teste de CI.

## Publicar o piloto: procedimento a implementar e ensaiar

Antes da primeira publicação, escolher hospedagem sem cobrança automática, confirmar quotas e separar homologação de participantes. Preparar um container com servidor HTTP apropriado, build React, código Laravel e dependências instaladas pelos lockfiles. Não usar vite dev ou artisan serve em serviço público.

Cada entrega deverá:

1. Selecionar SHA com CI verde e verificar o artefato imutável correspondente. Registrar também a versão anterior.
2. Conferir configurações e segredos pelo gerenciador do ambiente, sem imprimir valores. Usar TLS, cookies seguros, APP_DEBUG=false e permissões mínimas. Não trocar APP_KEY em cada deploy.
3. Se houver migração, revisar o plano específico abaixo antes de aplicar qualquer mudança.
4. Publicar primeiro em homologação. Conferir `/up` (processo vivo), `/api/v1/health` (banco e estrutura prontos), carregamento do React e isolamento dos perfis com dados sintéticos.
5. Obter autorização para liberar a versão no piloto; executar somente uma entrega por vez. Depois, verificar saúde e acesso sem inserir avaliações fictícias no banco de participantes.
6. Registrar SHA, artefato, ambiente, migrações aplicadas, resultado e responsável.

No provedor, definir health checks e timeout compatíveis com o serviço. Falta de banco deve resultar em indisponibilidade explícita, sem confirmação falsa de envio. A hospedagem gratuita pode suspender; não prometer disponibilidade contínua e não usar monitor para forçar o serviço a permanecer acordado.

## Migrações e backup

Antes de autorizar uma migração remota, registrar destino, schema, alterações, dados afetados, janela e alternativa de recuperação. Confirmar que a credencial de migração só existe no ambiente apropriado. CI nunca aplica migrações no banco real.

Preferir adicionar colunas/tabelas e manter compatibilidade com o código anterior. Remover ou renomear estruturas em outra entrega, depois da transição. Não usar migrate:fresh ou rollback indiscriminado em ambiente real. Executar migrations uma vez em etapa serializada da entrega; não em todo start ou health check do container.

Antes de mudanças relevantes e antes de receber alunos:

- Definir responsável, frequência, retenção, destino externo protegido e criptografia dos backups, com limites compatíveis com o plano gratuito. O disco do container não é destino persistente de backup.
- Não anexar dumps ou textos de participantes ao GitHub, logs de Actions ou artefatos públicos.
- Ensaiar restauração em outro banco, sem sobrescrever o original. Conferir estrutura, contagens, vínculos por escola e acesso sintético, registrando apenas evidências sem dados sensíveis.
- Medir quanto tempo a restauração levou e qual intervalo de dados pode ser perdido. Só então definir e aceitar metas de tempo de recuperação (RTO) e perda máxima (RPO).

Backup gerado não comprova restauração. Até haver ensaio e responsável, o piloto com alunos permanece pendente dessa condição.

## Incidentes

1. Registrar horário, sintoma, versão e ambiente. Logs devem conter identificador de requisição/erro, sem senhas, tokens, textos ou corpos completos de requisição.
2. Verificar processo, banco, quotas e última entrega. Se a falha afetar gravação ou acesso, interromper a liberação de novas atividades e informar o responsável institucional, sem diagnosticar alunos a partir de logs.
3. Escolher recuperação: reverter somente o código se o schema for compatível; caso contrário, preparar correção ou restauração pelo plano específico. Evitar perda de gravações feitas após o último backup.
4. Verificar o serviço recuperado, documentar causa e ação preventiva. Se um segredo foi exposto, revogá-lo e substituí-lo no ambiente antes de retomar.

Não há canal externo de alertas configurado nesta etapa. Antes da liberação, definir quem recebe avisos de falhas e quotas e quem assume na ausência do mantenedor. Não enviar dados de estudantes a serviços de monitoramento.
