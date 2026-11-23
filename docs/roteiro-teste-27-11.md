# Roteiro do teste de 27/11/2026 (piloto reduzido)

Teste com cerca de 20 estudantes da Escola Atual. Escopo, regras e variáveis: `piloto-reduzido.md`. Este roteiro não contém telefones, e-mails, tokens nem senhas; os contatos ficam fora do repositório.

**Papéis**
- Responsável técnico: o mantenedor do projeto (usuário).
- Responsável institucional: Diretor Pedagógico e Coordenador da Escola Atual.
- Quem lê os textos: psicólogo(a) da escola, pelo login único da escola.

## 1. Véspera (quinta, 26/11)

Marque cada item só depois de conferir; se algum falhar, decida pelo **plano B** (seção 7) até o fim do dia.

- [ ] Versão publicada é a `main` esperada (registrar o SHA) e o deploy foi autorizado e feito pelo responsável técnico.
- [ ] Migrações aplicadas **antes** do primeiro deploy e `php artisan alumia:database:check` ok (sem imprimir segredos).
- [ ] `/up` responde 200 e `/api/v1/health` responde 200 `ready` (503 significa banco ou migração faltando).
- [ ] Projeto Supabase ativo (não pausado) e conexão pelo Session Pooler funcionando.
- [ ] Backup feito (`scripts/ops/backup-db.sh`) para destino protegido fora do repositório e do container, e **restauração ensaiada** em banco descartável (`scripts/ops/restore-test.sh`), com tempo anotado.
- [ ] Administrador inicial criado com senha digitada em entrada oculta; senha guardada em cofre.
- [ ] Escola Atual criada pelo administrador; senha temporária entregue por canal seguro e **trocada** no primeiro acesso.
- [ ] Período criado pelo administrador: início em 27/11 (abre 00:00:00) e fim em 03/12 (fecha 23:59:59), horário de Brasília; conferir as datas na tela. Se o teste for de um dia só, planejar o encerramento manual no fim (seção 5).
- [ ] ~20 códigos de estudante criados pela escola e ~20 tokens gerados (seção 2).
- [ ] Ensaio completo com **dados sintéticos** (nunca alunos): administrador abre período, um código de teste entra, envia, a escola lê. Depois, revogar o acesso de teste.
- [ ] Texto de aviso ao estudante e DEC-04 (consentimento, menores, LGPD) **aprovados** pelo responsável institucional. Sem isso, não usar com alunos.

## 2. Entrega dos tokens

O token aparece **uma única vez**, na tela da escola, ao criar o acesso. Para não guardá-lo em lugar inseguro:

1. Use **códigos internos** (por exemplo `TURMA-01`), sem nome, e-mail ou documento do aluno.
2. Imprima uma **tira por aluno** com o código e o token (ou escreva à mão), direto da tela, sem salvar em arquivo, planilha, e-mail, mensagem ou nuvem. Ocultar a credencial na tela depois de imprimir.
3. A **escola** mantém, fora da plataforma, a correspondência aluno ↔ código ↔ tira (por exemplo, a coordenação distribui as tiras por lista própria).
4. Entregue as tiras em mãos, na hora do teste; **recolha todas no fim**, inclusive as não usadas, e destrua-as (picotar). O token ainda vale: se uma tira se perder, a escola usa "Revogar acesso" ou "Gerar novo token".
5. Nenhum agente, o mantenedor ou a equipe técnica precisa conhecer a correspondência entre aluno e token.

## 3. Manhã do teste (27/11)

- [ ] Cerca de **10 minutos antes** da turma, abrir `/up` para acordar o serviço (o plano gratuito dorme por inatividade; a primeira resposta pode levar cerca de 1 minuto). Não usar monitor para mantê-lo acordado.
- [ ] `/api/v1/health` = 200 `ready`.
- [ ] Supabase não pausado (painel do projeto ou health ok).
- [ ] Período aparece como **Aberto** na tela do administrador.
- [ ] Teste rápido com o acesso de teste sintético, depois revogá-lo.
- [ ] Wi-Fi/rede da sala conferidos e, se possível, um celular com dados móveis de reserva.

## 4. Durante o teste

**Entrada em grupos.** O plano gratuito tem pouca CPU (0,1). Em teste local nesse limite, 24 estudantes entrando juntos tiveram respostas de 10 a 25 s; espalhados em 1 minuto, 3 a 7 s. Peça que entrem **em grupos de 5, com ~1 minuto de intervalo**, e que esperem a tela carregar antes de clicar de novo.

**O que observar:** se a tela de escrita aparece com o aviso; se o envio mostra "Texto enviado"; mensagens de erro na tela; quantos estudantes terminaram (contagem na tela da escola/administração, sem abrir textos).

**Se o login falhar** ("Credenciais inválidas"): conferir se digitou o token inteiro (64 caracteres) sem espaços; se persistir, a escola gera novo token ("Gerar novo token") e entrega nova tira. "Muitas tentativas": esperar 1 minuto.

**Se a rede da escola cair:** o texto digitado fica só na tela do navegador; não atualizar nem fechar a página. Se o envio mostrar que não foi confirmado, usar "Verificar se o texto foi enviado" antes de reenviar. Se a rede não voltar, o aluno pode tentar de outro dispositivo com o mesmo token ainda dentro do período.

**Se aparecer 503 / "O serviço está indisponível":** (a) aguardar 1 minuto, pode ser o serviço acordando; (b) abrir `/api/v1/health`: 503 indica problema de banco (Supabase pausado ou fora do ar), 200 indica sobrecarga momentânea; (c) o aluno **não perde** o texto na tela, mas só vale como enviado quando aparecer "Texto enviado"; (d) se durar mais de 10 minutos, o responsável técnico decide pelo plano B e registra o horário e o sintoma (sem textos de alunos).

**Se o aluno disser que precisa de ajuda:** isso foge do sistema; a escola segue o protocolo próprio (adulto de confiança, CVV 188). O sistema não monitora conteúdo nem responde.

## 5. Depois do teste

- [ ] Administrador **encerra o período** (bloqueia novos envios na hora) e confere a contagem de envios.
- [ ] Recolher e destruir as tiras de token; a escola revoga os acessos que não serão mais usados.
- [ ] **Backup** logo após o encerramento e ensaio de restauração em banco descartável.
- [ ] Avisar o **psicólogo** para ler os textos **em até 24 horas**, na tela da escola; os textos não são copiados para outros meios.
- [ ] Anotar problemas (horários, mensagens, quantos concluíram) sem copiar textos de alunos.
- [ ] Decidir com o responsável institucional o destino dos dados (retenção e exclusão dependem de DEC-04).

## 6. Contatos

Mantidos fora do repositório, em local combinado entre as partes: responsável técnico (usuário), Diretor Pedagógico, Coordenador e psicólogo(a) da Escola Atual. Combinar na véspera como se falar durante o teste (por exemplo, um grupo próprio).

## 7. Plano B: demonstração com dados fictícios

Se qualquer item da véspera ou da manhã falhar sem solução a tempo, ou se o serviço ficar indisponível durante o teste, apresentar a **demonstração** publicada no GitHub Pages (build separado, dados fictícios, aviso permanente). Ela **não** coleta textos reais nem tem análise validada: ao usá-la, informar aos alunos que é uma demonstração. A publicação da demonstração é manual e exige autorização (`operacao.md`); confirmar na véspera que ela está no ar. Nenhum aluno deve inserir dados pessoais nela.
