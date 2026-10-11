# syntax=docker/dockerfile:1.7

# ---------------------------------------------------------------------------
# TAPeira is a pure client-side game: two HTML pages plus css/, script/,
# imagens/ and media/. There is nothing to compile for the browser build, so
# the image only has to assemble those files and serve them as static assets.
# ---------------------------------------------------------------------------

# Global build arg: must be declared before the first FROM to be usable in a
# later FROM line. Overridable via compose / `docker build --build-arg`.
ARG NGINX_IMAGE=nginxinc/nginx-unprivileged:1.27-alpine

# ---- Stage 1: assemble and sanity-check the static site -------------------
FROM alpine:3.20 AS site

WORKDIR /site

# Copy only the directories the pages actually reference. This keeps the
# runtime image free of tests, native shells and build tooling.
COPY index.html Caverna.html ./
COPY css/ ./css/
COPY script/ ./script/
COPY imagens/ ./imagens/
COPY media/ ./media/

# Fail the build early if the expected layout ever changes.
RUN test -f index.html \
    && test -f Caverna.html \
    && test -d css && test -d script && test -d imagens && test -d media

# ---- Stage 2: hardened nginx runtime --------------------------------------
FROM ${NGINX_IMAGE} AS runtime

LABEL org.opencontainers.image.title="TAPeira" \
      org.opencontainers.image.description="TAPeira - uma aventura sob a montanha (browser build)" \
      org.opencontainers.image.version="1.2.0" \
      org.opencontainers.image.licenses="ISC"

# Custom server block (gzip, caching, security headers, /healthz).
COPY docker/nginx.conf /etc/nginx/conf.d/default.conf

# Static game files. --chown keeps them readable by the non-root nginx user.
COPY --from=site --chown=101:101 /site /usr/share/nginx/html

EXPOSE 8080

# The unprivileged image already runs as UID 101 and reads the pid from /tmp.
HEALTHCHECK --interval=30s --timeout=5s --start-period=5s --retries=3 \
    CMD wget -q -O /dev/null http://127.0.0.1:8080/healthz || exit 1
