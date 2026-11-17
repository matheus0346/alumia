# Backend AlumIA

Leia `../docs/arquitetura-piloto.md` e a issue antes de alterar o backend.

- PHP 8.3+ e Laravel 13; banco alvo PostgreSQL, schema privado `alumia`.
- O frontend React continua em `../src`; não criar outro frontend neste diretório.
- Nenhum aluno deve precisar fornecer nome, e-mail ou identidade direta.
- Não adicionar cadastro público ou recuperação pública de senha institucional.
- Autorização por escola deve existir no servidor antes de expor dados.
- Não incluir tokens, senhas, textos sensíveis ou chaves em logs ou exemplos reais.
- User representa identidades institucionais `admin`/`school`; Student é a identidade estudantil separada. Ler `../docs/acessos-backend.md`. Não reintroduzir nome/e-mail de aluno ou recuperação pública de credenciais.
- Não incluir dados demonstrativos no seeder padrão.
- Não executar migrações no Supabase ou publicar sem a etapa autorizada de implantação.
- Para validar: `composer validate --strict`, `composer lint` e `composer test`.
- SQLite em memória é teste rápido; validar também no PostgreSQL com banco `*_test` e schema `*_testing`. Nunca apontar os testes para dados reais.
- Sem worker contratado, não presumir execução permanente de filas.
- Instalar ferramentas somente no ambiente autorizado; não exigir Laravel Boost nem modificar o sistema como pré-requisito.
