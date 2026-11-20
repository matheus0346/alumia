#!/usr/bin/env bash
# Verificação local do container (OPS-003). Usa somente um PostgreSQL descartável em container,
# com credenciais geradas a cada execução. Nunca aponta para Supabase nem para dados reais.
set -euo pipefail

IMAGE="${IMAGE:-alumia:smoke}"
RUN_ID="alumia-smoke-$$"
NET="$RUN_ID-net"
PG="$RUN_ID-pg"
APP="$RUN_ID-app"
PGPASS="$(head -c 18 /dev/urandom | base64 | tr -dc 'A-Za-z0-9')"

cleanup() {
  docker rm -f "$APP" "$PG" >/dev/null 2>&1 || true
  docker network rm "$NET" >/dev/null 2>&1 || true
}
trap cleanup EXIT

fail() { echo "FALHOU: $*" >&2; docker logs --tail 40 "$APP" >&2 2>&1 || true; exit 1; }
status() { curl -s -o /dev/null -w '%{http_code}' "$1"; }
ok() { echo "ok  - $*"; }

if [ "${SKIP_BUILD:-0}" != 1 ]; then
  docker build --build-arg GIT_SHA="$(git rev-parse HEAD)" -t "$IMAGE" .
fi

docker network create "$NET" >/dev/null
docker run -d --name "$PG" --network "$NET" \
  -e POSTGRES_USER=alumia_test -e POSTGRES_PASSWORD="$PGPASS" -e POSTGRES_DB=alumia_container_test \
  postgres:16 >/dev/null
for _ in $(seq 1 40); do
  docker exec "$PG" pg_isready -U alumia_test -d alumia_container_test >/dev/null 2>&1 && break
  sleep 1
done
docker exec "$PG" psql -U alumia_test -d alumia_container_test -qc 'CREATE SCHEMA IF NOT EXISTS alumia' >/dev/null

APP_KEY="$(docker run --rm "$IMAGE" php -r 'echo "base64:".base64_encode(random_bytes(32));')"
docker run -d --name "$APP" --network "$NET" -p 127.0.0.1::8080 \
  -e APP_KEY="$APP_KEY" -e APP_URL=http://localhost \
  -e DB_CONNECTION=pgsql -e DB_HOST="$PG" -e DB_PORT=5432 -e DB_DATABASE=alumia_container_test \
  -e DB_USERNAME=alumia_test -e DB_PASSWORD="$PGPASS" -e DB_SCHEMA=alumia -e DB_SSLMODE=prefer \
  -e SESSION_SECURE_COOKIE=false \
  "$IMAGE" >/dev/null
PORT="$(docker port "$APP" 8080/tcp | head -1 | sed 's/.*://')"
BASE="http://127.0.0.1:$PORT"

for _ in $(seq 1 30); do [ "$(status "$BASE/up")" = 200 ] && break; sleep 1; done

[ "$(status "$BASE/up")" = 200 ] || fail "/up não respondeu 200"
ok "/up responde 200 (processo vivo)"

[ "$(docker exec "$APP" id -u)" != 0 ] || fail "container roda como root"
ok "processo roda sem root (uid $(docker exec "$APP" id -u))"

HEADERS="$(curl -si "$BASE/up")"
echo "$HEADERS" | grep -qi '^X-Powered-By' && fail "X-Powered-By exposto"
echo "$HEADERS" | grep -qi '^Server: Apache/[0-9]' && fail "versão do Apache exposta"
ok "sem X-Powered-By nem versão do servidor"

# Antes das migrações: indisponibilidade explícita, sem vazar detalhes do banco.
BODY="$(curl -s -w '\n%{http_code}' "$BASE/api/v1/health")"
[ "$(echo "$BODY" | tail -1)" = 503 ] || fail "esperado 503 not_ready antes das migrações: $BODY"
echo "$BODY" | head -1 | grep -q 'not_ready' || fail "corpo inesperado: $BODY"
echo "$BODY" | grep -qiE 'password|SQLSTATE|alumia_test|host' && fail "health vazou detalhes"
ok "/api/v1/health = 503 not_ready sem migrações, sem vazar detalhes"

# Migração somente no PostgreSQL descartável deste teste.
docker exec "$APP" php artisan migrate --force >/dev/null
BODY="$(curl -s -w '\n%{http_code}' "$BASE/api/v1/health")"
[ "$(echo "$BODY" | tail -1)" = 200 ] || fail "esperado 200 ready depois das migrações: $BODY"
echo "$BODY" | head -1 | grep -q '"ready"' || fail "corpo inesperado: $BODY"
ok "/api/v1/health = 200 ready depois de migrar o banco descartável"
docker exec "$APP" php artisan alumia:database:check >/dev/null && ok "alumia:database:check passou"

[ "$(status "$BASE/")" = 200 ] || fail "/ não serviu o React"
curl -s "$BASE/" | grep -q '/app/assets/' || fail "index.html sem os assets do piloto"
ASSET="$(curl -s "$BASE/" | grep -o '/app/assets/[^"]*\.js' | head -1)"
[ "$(status "$BASE$ASSET")" = 200 ] || fail "asset $ASSET não servido"
[ "$(curl -s "$BASE/app/build-mode.json")" = '{"mode":"pilot"}' ] || fail "build não é o do piloto"
ok "React do piloto servido em / e assets em /app/assets"

[ "$(status "$BASE/.env")" != 200 ] || fail ".env acessível"
[ "$(status "$BASE/app/")" != 500 ] || fail "/app/ com erro 500"
ok "arquivos ocultos não são servidos"

for _ in $(seq 1 20); do
  [ "$(docker inspect -f '{{.State.Health.Status}}' "$APP")" = healthy ] && break
  sleep 3
done
[ "$(docker inspect -f '{{.State.Health.Status}}' "$APP")" = healthy ] || fail "HEALTHCHECK do Docker não ficou healthy"
ok "HEALTHCHECK do Docker = healthy"

if docker logs "$APP" 2>&1 | grep -q "$PGPASS"; then fail "senha de teste apareceu nos logs"; fi
ok "logs sem a credencial de teste"

echo "Container verificado: $(docker image inspect -f '{{index .Config.Labels "org.opencontainers.image.revision"}}' "$IMAGE")"
