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
  postgres:16@sha256:3950ad7c3148ca2175ef1b6c36c9efbf78957ae8fbe8b3a5d7c35af50500382f >/dev/null
PG_READY=0
for _ in $(seq 1 60); do
  if docker exec "$PG" pg_isready -h 127.0.0.1 -U alumia_test -d alumia_container_test >/dev/null 2>&1; then PG_READY=1; break; fi
  sleep 1
done
[ "$PG_READY" = 1 ] || fail "PostgreSQL descartável não ficou pronto em 60 s"
docker exec "$PG" psql -U alumia_test -d alumia_container_test -qc 'CREATE SCHEMA IF NOT EXISTS alumia' >/dev/null

APP_KEY="$(docker run --rm "$IMAGE" php -r 'echo "base64:".base64_encode(random_bytes(32));')"
docker run -d --name "$APP" --network "$NET" -p 127.0.0.1::8080 \
  -e APP_KEY="$APP_KEY" -e APP_URL=http://localhost \
  -e DB_CONNECTION=pgsql -e DB_HOST="$PG" -e DB_PORT=5432 -e DB_DATABASE=alumia_container_test \
  -e DB_USERNAME=alumia_test -e DB_PASSWORD="$PGPASS" -e DB_SCHEMA=alumia -e DB_SSLMODE=prefer \
  -e SESSION_SECURE_COOKIE=false \
  "$IMAGE" >/dev/null
PORT="$(docker port "$APP" 8080/tcp | sed -n '1s/.*://p')"
BASE="http://127.0.0.1:$PORT"

for _ in $(seq 1 30); do [ "$(status "$BASE/up")" = 200 ] && break; sleep 1; done

[ "$(status "$BASE/up")" = 200 ] || fail "/up não respondeu 200"
ok "/up responde 200 (processo vivo)"

[ "$(docker exec "$APP" id -u)" != 0 ] || fail "container roda como root"
ok "processo roda sem root (uid $(docker exec "$APP" id -u))"

HEADERS="$(curl -si "$BASE/up")"
grep -qi '^X-Powered-By' <<<"$HEADERS" && fail "X-Powered-By exposto"
grep -qi '^Server: Apache/[0-9]' <<<"$HEADERS" && fail "versão do Apache exposta"
ok "sem X-Powered-By nem versão do servidor"

# Antes das migrações: indisponibilidade explícita, sem vazar detalhes do banco.
BODY="$(curl -s -w '\n%{http_code}' "$BASE/api/v1/health")"
[ "$(tail -n1 <<<"$BODY")" = 503 ] || fail "esperado 503 not_ready antes das migrações: $BODY"
sed -n 1p <<<"$BODY" | grep -q 'not_ready' || fail "corpo inesperado: $BODY"
grep -qiE 'password|SQLSTATE|alumia_test|host' <<<"$BODY" && fail "health vazou detalhes"
ok "/api/v1/health = 503 not_ready sem migrações, sem vazar detalhes"

# Migração somente no PostgreSQL descartável deste teste.
docker exec "$APP" php artisan migrate --force >/dev/null
BODY="$(curl -s -w '\n%{http_code}' "$BASE/api/v1/health")"
[ "$(tail -n1 <<<"$BODY")" = 200 ] || fail "esperado 200 ready depois das migrações: $BODY"
sed -n 1p <<<"$BODY" | grep -q '"ready"' || fail "corpo inesperado: $BODY"
ok "/api/v1/health = 200 ready depois de migrar o banco descartável"
docker exec "$APP" php artisan alumia:database:check >/dev/null || fail "alumia:database:check falhou"
ok "alumia:database:check passou"

[ "$(status "$BASE/")" = 200 ] || fail "/ não serviu o React"
INDEX="$(curl -s "$BASE/")"
grep -q '/app/assets/' <<<"$INDEX" || fail "index.html sem os assets do piloto"
ASSET="$(grep -om1 '/app/assets/[^"]*\.js' <<<"$INDEX" || true)"
[ -n "$ASSET" ] || fail "nenhum asset .js encontrado no index.html"
[ "$(status "$BASE$ASSET")" = 200 ] || fail "asset $ASSET não servido"
[ "$(curl -s "$BASE/app/build-mode.json")" = '{"mode":"pilot"}' ] || fail "build não é o do piloto"
ok "React do piloto servido em / e assets em /app/assets"

docker exec -u root "$APP" sh -c 'echo probe > /var/www/html/public/.probe'
[ "$(status "$BASE/.probe")" = 403 ] || fail "arquivo oculto em public/ não retornou 403"
[ "$(status "$BASE/.htaccess")" = 403 ] || fail ".htaccess não retornou 403"
docker exec -u root "$APP" rm -f /var/www/html/public/.probe
[ "$(status "$BASE/app/")" != 500 ] || fail "/app/ com erro 500"
ok "arquivos ocultos em public/ respondem 403"

# Código somente leitura para o usuário da aplicação; só storage/ e bootstrap/cache são graváveis.
for d in app vendor public config; do
  if docker exec "$APP" sh -c "touch /var/www/html/$d/.w 2>/dev/null"; then fail "$d/ gravável por www-data"; fi
done
docker exec "$APP" sh -c 'touch /var/www/html/storage/.w && rm /var/www/html/storage/.w' || fail "storage/ não gravável"
ok "app/, vendor/, public/ e config/ não são graváveis; storage/ é"

# Variáveis de ambiente padrão da imagem ativas (sem imprimir segredos).
CFG="$(docker exec "$APP" php -r 'require "vendor/autoload.php"; $a = require "bootstrap/app.php"; $a->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap(); echo json_encode([config("session.encrypt"), config("app.locale"), config("app.debug"), config("logging.channels.stderr.level")]);' 2>/dev/null | tail -n1)"
[ "$CFG" = '[true,"pt_BR",false,"warning"]' ] || fail "configuração padrão inesperada: $CFG"
ok "session.encrypt=true, locale=pt_BR, debug=false, log warning"


for _ in $(seq 1 20); do
  [ "$(docker inspect -f '{{.State.Health.Status}}' "$APP")" = healthy ] && break
  sleep 3
done
[ "$(docker inspect -f '{{.State.Health.Status}}' "$APP")" = healthy ] || fail "HEALTHCHECK do Docker não ficou healthy"
ok "HEALTHCHECK do Docker = healthy"

LOGS="$(docker logs "$APP" 2>&1)"
if grep -qF "$PGPASS" <<<"$LOGS"; then fail "credencial vazou nos logs"; fi
ok "logs sem a credencial de teste"

echo "Container verificado: $(docker image inspect -f '{{index .Config.Labels "org.opencontainers.image.revision"}}' "$IMAGE")"
