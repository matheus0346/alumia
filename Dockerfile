# syntax=docker/dockerfile:1
#
# Container do piloto AlumIA (OPS-003): React (build de produção) + Laravel servidos por Apache + PHP.
# Não usa `vite dev` nem `artisan serve`. Dependências instaladas somente pelos lockfiles
# (`npm ci` e `composer install`). O mesmo artefato é promovido entre ambientes; configuração e
# segredos chegam por variáveis de ambiente em tempo de execução, nunca na imagem.
#
# Construir:  docker build --build-arg GIT_SHA="$(git rev-parse HEAD)" -t alumia:local .
# Verificar:  bash scripts/container-smoke.sh   (usa apenas um PostgreSQL descartável em container)
#
# Imagens base fixadas por tag e digest para repetir o build; atualizar com revisão e a verificação acima.
ARG NODE_IMAGE=node:22-bookworm-slim@sha256:e9f565d32859f0cbfb52125eafe8be39390f24dac302dc3cdf566e8ba3ab21ee
ARG PHP_IMAGE=php:8.3-apache-bookworm@sha256:d60f7be79a869deb1562b6ecb2f555bccb65c8dd4af930b50ae4d14d4bd4696c
ARG COMPOSER_IMAGE=composer:2@sha256:919efe8e62179c71dfd31fad035fd671fe7454211c6b2aa30a10af0ab4acedba

# ---------------------------------------------------------------------------
FROM ${COMPOSER_IMAGE} AS composer-bin

# ---------------------------------------------------------------------------
# Frontend: build do piloto (nunca o da demonstração).
FROM ${NODE_IMAGE} AS frontend
WORKDIR /src
COPY package.json package-lock.json ./
RUN npm ci --no-audit --no-fund
COPY index.html vite.config.js ./
COPY public ./public
COPY src ./src
COPY scripts ./scripts
# `npm run build` gera dist, confere o isolamento do piloto e sincroniza em backend/public/app.
RUN mkdir -p backend/public && npm run build

# ---------------------------------------------------------------------------
# Base PHP com as extensões necessárias (PostgreSQL e OPcache; SQLite já vem na imagem oficial).
FROM ${PHP_IMAGE} AS php-base
RUN set -eux; \
    apt-get update; \
    apt-get install -y --no-install-recommends libpq-dev unzip; \
    docker-php-ext-install -j"$(nproc)" pdo_pgsql opcache; \
    apt-get purge -y --auto-remove libpq-dev; \
    apt-get install -y --no-install-recommends libpq5; \
    rm -rf /var/lib/apt/lists/*

# ---------------------------------------------------------------------------
# Dependências PHP de produção, pelo composer.lock.
FROM php-base AS vendor
COPY --from=composer-bin /usr/bin/composer /usr/bin/composer
ENV COMPOSER_ALLOW_SUPERUSER=1 COMPOSER_NO_INTERACTION=1
WORKDIR /app
COPY backend/composer.json backend/composer.lock ./
RUN composer install --no-dev --no-scripts --no-autoloader --prefer-dist
COPY backend/ ./
RUN composer dump-autoload --no-dev --classmap-authoritative \
    && php artisan package:discover --ansi

# ---------------------------------------------------------------------------
# Imagem final.
FROM php-base AS runtime
RUN set -eux; \
    mv "$PHP_INI_DIR/php.ini-production" "$PHP_INI_DIR/php.ini"; \
    a2enmod rewrite headers; \
    a2dissite 000-default; \
    : > /etc/apache2/ports.conf
COPY docker/php.ini "$PHP_INI_DIR/conf.d/zz-alumia.ini"
COPY docker/apache.conf /etc/apache2/sites-available/alumia.conf
RUN a2ensite alumia

WORKDIR /var/www/html
# Código pertence ao root (somente leitura para www-data); só storage/ e bootstrap/cache são graváveis.
COPY --from=vendor /app ./
COPY --from=frontend /src/backend/public/app ./public/app
RUN set -eux; \
    mkdir -p storage/framework/cache/data storage/framework/sessions storage/framework/views storage/logs storage/app/private storage/app/public bootstrap/cache; \
    chown -R www-data:www-data storage bootstrap/cache /var/run/apache2 /var/lock/apache2 /var/log/apache2; \
    chmod -R ug+rwX storage bootstrap/cache

# Sem .env na imagem: estes são os padrões seguros; o ambiente pode sobrescrevê-los.
ENV APP_ENV=production APP_DEBUG=false LOG_CHANNEL=stderr LOG_LEVEL=warning SESSION_ENCRYPT=true APP_LOCALE=pt_BR APP_FALLBACK_LOCALE=pt_BR
# GIT_SHA é obrigatório (--build-arg GIT_SHA=$(git rev-parse HEAD)); fica aqui para não invalidar o cache acima.
# No Render o SHA chega em RENDER_GIT_COMMIT (variável de build); fora dele, --build-arg GIT_SHA.
ARG GIT_SHA
ARG RENDER_GIT_COMMIT
RUN test -n "${GIT_SHA:-$RENDER_GIT_COMMIT}" || { echo 'ERRO: informe --build-arg GIT_SHA=$(git rev-parse HEAD)' >&2; exit 1; }
LABEL org.opencontainers.image.title="AlumIA (React + Laravel)" \
      org.opencontainers.image.source="https://github.com/matheus0346/alumia" \
      org.opencontainers.image.revision="${GIT_SHA:-$RENDER_GIT_COMMIT}"
USER www-data
EXPOSE 8080
# /up = processo vivo. /api/v1/health (banco e estrutura prontos) é a verificação de prontidão do provedor.
HEALTHCHECK --interval=30s --timeout=5s --start-period=15s --retries=3 \
    CMD ["php", "-r", "exit(@file_get_contents('http://127.0.0.1:8080/up') === false ? 1 : 0);"]
CMD ["apache2-foreground"]
