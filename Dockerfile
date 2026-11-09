# syntax=docker/dockerfile:1.7
FROM oven/bun:1.3.4@sha256:7608db4aeb44f1fe8169cc8ec7055376b3013557b106407ccf092b00e426407d AS bun
FROM node:24-bookworm-slim@sha256:01d566e8d94d8c619591d78652babfccd3c6992a3dffa9ed5ab39e11cf6c70e9 AS dependencies
WORKDIR /app
COPY --from=bun /usr/local/bin/bun /usr/local/bin/bun
RUN apt-get update && apt-get install -y --no-install-recommends python3 make g++ ca-certificates && rm -rf /var/lib/apt/lists/*
COPY package.json bun.lock ./
COPY patches ./patches
RUN bun install --frozen-lockfile

FROM dependencies AS builder
COPY . .
ENV NEXT_TELEMETRY_DISABLED=1
ARG BUILD_INPUT_DIGEST
RUN --mount=type=secret,id=build_db,required=true \
    --mount=type=secret,id=build_env,required=true \
    test -n "$BUILD_INPUT_DIGEST" && gunzip -c /run/secrets/build_db > /tmp/build.sqlite && \
    SQLITE_PATH=/tmp/build.sqlite node --env-file=/run/secrets/build_env node_modules/next/dist/bin/next build && \
    rm -f /tmp/build.sqlite /tmp/build.sqlite-wal /tmp/build.sqlite-shm && \
    find .next/standalone -type f \( -name '*.sqlite' -o -name '*.sqlite-wal' -o -name '*.sqlite-shm' -o -name '.env*' \) -delete

FROM dependencies AS maintenance
COPY scripts ./scripts
COPY src/db ./src/db
COPY drizzle/sqlite ./drizzle/sqlite
COPY tsconfig.json ./
ENTRYPOINT ["node", "--import", "tsx", "scripts/migration/database.ts"]

FROM node:24-bookworm-slim@sha256:01d566e8d94d8c619591d78652babfccd3c6992a3dffa9ed5ab39e11cf6c70e9 AS runner
WORKDIR /app
ENV NODE_ENV=production NEXT_TELEMETRY_DISABLED=1 HOSTNAME=0.0.0.0 PORT=3000 SQLITE_PATH=/data/website.sqlite
COPY --from=builder --chown=node:node /app/.next/standalone ./
COPY --from=builder --chown=node:node /app/.next/static ./.next/static
COPY --from=builder --chown=node:node /app/public ./public
COPY deploy/jobs.mjs ./deploy/jobs.mjs
ARG SOURCE_REVISION
LABEL org.opencontainers.image.revision=$SOURCE_REVISION
LABEL org.opencontainers.image.source=https://github.com/UniClipboard/uc-website
USER node
EXPOSE 3000
HEALTHCHECK --interval=30s --timeout=5s --start-period=30s CMD node -e "fetch('http://127.0.0.1:3000/api/health/live').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"
CMD ["node", "server.js"]

FROM runner AS scheduler
USER root
RUN apt-get update && apt-get install -y --no-install-recommends cron restic ca-certificates && rm -rf /var/lib/apt/lists/*
COPY deploy/crontab /etc/cron.d/uc-website
RUN chmod 0644 /etc/cron.d/uc-website
HEALTHCHECK NONE
CMD ["cron", "-f"]

FROM runner AS website
