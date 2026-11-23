#!/usr/bin/env bash
# Backup lógico (pg_dump) do schema alumia para um diretório PROTEGIDO FORA do repositório e do container (OPS-005).
# Uso:  BACKUP_DIR=/caminho/protegido bash scripts/ops/backup-db.sh
# Lê DB_HOST, DB_PORT, DB_DATABASE, DB_USERNAME, DB_PASSWORD do ambiente (exportados a partir do cofre; nunca em argumentos).
# Opcional: AGE_RECIPIENT=age1... cifra o dump com `age` (recomendado para destino em nuvem).
# O dump contém textos de estudantes: nunca anexar ao GitHub, ao chat nem a artefatos de CI.
set -euo pipefail

PG_IMAGE="${PG_IMAGE:-postgres:17@sha256:223efeb196329b55b3b9a13db144956411dbc18e727e59f681c3e0aede6475cf}"
fail() { echo "FALHOU: $*" >&2; exit 1; }
ok() { echo "ok  - $*"; }

for v in DB_HOST DB_DATABASE DB_USERNAME DB_PASSWORD BACKUP_DIR; do
  [ -n "${!v:-}" ] || fail "variável $v não definida"
done
DB_PORT="${DB_PORT:-5432}"
SCHEMA="${DB_SCHEMA:-alumia}"

mkdir -p "$BACKUP_DIR" || fail "não foi possível criar BACKUP_DIR"
BACKUP_DIR="$(cd "$BACKUP_DIR" && pwd)"
REPO_ROOT="$(git -C "$BACKUP_DIR" rev-parse --show-toplevel 2>/dev/null || true)"
[ -z "$REPO_ROOT" ] || fail "BACKUP_DIR está dentro de um repositório Git ($REPO_ROOT)"
PERM="$(stat -c %a "$BACKUP_DIR")"
case "$PERM" in
  700) ;;
  *) fail "BACKUP_DIR deve ter permissão 700 (atual: $PERM). Rode: chmod 700 \"$BACKUP_DIR\"" ;;
esac

STAMP="$(date -u +%Y%m%dT%H%M%SZ)"
OUT="$BACKUP_DIR/alumia-$STAMP.dump"
umask 077
# --no-owner/--no-privileges: restaura em qualquer banco sem depender dos papéis do Supabase.
# -e sem valor herda do ambiente do processo: a senha não aparece nos argumentos do docker (ps, /proc/*/cmdline).
export PGPASSWORD="$DB_PASSWORD" PGSSLMODE="${DB_SSLMODE:-require}"
docker run --rm ${DOCKER_NETWORK:+--network "$DOCKER_NETWORK"} -e PGPASSWORD -e PGSSLMODE "$PG_IMAGE" \
  pg_dump -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USERNAME" -d "$DB_DATABASE" \
  --schema="$SCHEMA" --format=custom --no-owner --no-privileges > "$OUT" || { rm -f "$OUT"; fail "pg_dump falhou (nada foi gravado)"; }
[ -s "$OUT" ] || { rm -f "$OUT"; fail "dump vazio"; }
ok "dump gerado: $(basename "$OUT") ($(stat -c %s "$OUT") bytes)"

if [ -n "${AGE_RECIPIENT:-}" ]; then
  command -v age >/dev/null || fail "AGE_RECIPIENT definido, mas o comando age não existe"
  age -r "$AGE_RECIPIENT" -o "$OUT.age" "$OUT" || { rm -f "$OUT.age"; fail "falha ao cifrar"; }
  rm -f "$OUT"
  OUT="$OUT.age"
  ok "dump cifrado: $(basename "$OUT")"
fi
sha256sum "$OUT" > "$OUT.sha256"
ok "checksum gravado: $(basename "$OUT").sha256"
echo "Copie o arquivo para o destino externo protegido; o disco do container não é destino de backup."
