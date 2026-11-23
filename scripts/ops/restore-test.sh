#!/usr/bin/env bash
# Ensaio de restauração (OPS-005): restaura um dump em um PostgreSQL DESCARTÁVEL em container e confere estrutura e contagens.
# Nunca aponta para Supabase nem para o banco original. Imprime só contagens, nunca conteúdo.
# Uso:  bash scripts/ops/restore-test.sh /caminho/alumia-AAAAMMDDTHHMMSSZ.dump
set -euo pipefail

PG_IMAGE="${PG_IMAGE:-postgres:17@sha256:223efeb196329b55b3b9a13db144956411dbc18e727e59f681c3e0aede6475cf}"
DUMP="${1:-}"
CT="alumia-restore-$$"
fail() { echo "FALHOU: $*" >&2; exit 1; }
ok() { echo "ok  - $*"; }
cleanup() { docker rm -f "$CT" >/dev/null 2>&1 || true; }
trap cleanup EXIT

[ -n "$DUMP" ] && [ -f "$DUMP" ] || fail "informe o caminho de um dump existente"
case "$DUMP" in *.age) fail "decifre antes (age -d) para um diretório temporário protegido" ;; esac
if [ -f "$DUMP.sha256" ]; then
  EXPECTED="$(cut -d' ' -f1 "$DUMP.sha256")"
  ACTUAL="$(sha256sum "$DUMP")"
  [ "${ACTUAL%% *}" = "$EXPECTED" ] || fail "checksum do dump não confere"
  ok "checksum confere"
fi

PGPASS="$(head -c 18 /dev/urandom | base64 | tr -dc 'A-Za-z0-9')"
START="$(date +%s)"
docker run -d --name "$CT" -e POSTGRES_USER=restore -e POSTGRES_PASSWORD="$PGPASS" -e POSTGRES_DB=alumia_restore "$PG_IMAGE" >/dev/null
READY=0
for _ in $(seq 1 60); do
  if docker exec "$CT" pg_isready -h 127.0.0.1 -U restore -d alumia_restore >/dev/null 2>&1; then READY=1; break; fi
  sleep 1
done
[ "$READY" = 1 ] || fail "PostgreSQL descartável não ficou pronto"
sleep 2
docker cp "$DUMP" "$CT:/tmp/restore.dump"
docker exec "$CT" pg_restore -h 127.0.0.1 -U restore -d alumia_restore --no-owner --exit-on-error /tmp/restore.dump || fail "pg_restore falhou"
ok "restauração concluída em $(( $(date +%s) - START )) s (banco descartável)"

for t in schools users students credential_events assessment_periods assessment_submissions; do
  N="$(docker exec "$CT" psql -h 127.0.0.1 -U restore -d alumia_restore -tAc "select count(*) from alumia.$t")" || fail "tabela alumia.$t ausente após restauração"
  echo "     $t: $N"
done
ok "estrutura restaurada e tabelas consultáveis"
ORPHANS="$(docker exec "$CT" psql -h 127.0.0.1 -U restore -d alumia_restore -tAc "select count(*) from alumia.assessment_submissions s left join alumia.assessment_periods p on p.id=s.assessment_period_id left join alumia.students st on st.id=s.student_id where p.id is null or st.id is null or st.school_id <> p.school_id")"
[ "$ORPHANS" = 0 ] || fail "envios sem período/estudante ou de outra escola: $ORPHANS"
ok "vínculos por escola consistentes (0 inconsistências)"
echo "Registre o tempo medido acima para definir RTO; a idade do dump define o RPO. Banco descartável removido ao sair."
