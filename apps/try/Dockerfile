# syntax=docker/dockerfile:1.7
FROM oven/bun:1.3.4@sha256:7608db4aeb44f1fe8169cc8ec7055376b3013557b106407ccf092b00e426407d AS bun
FROM node:24-bookworm-slim@sha256:01d566e8d94d8c619591d78652babfccd3c6992a3dffa9ed5ab39e11cf6c70e9 AS dependencies
WORKDIR /repo/apps/try
COPY --from=bun /usr/local/bin/bun /usr/local/bin/bun
COPY apps/try/package.json apps/try/bun.lock ./
COPY apps/try/patches ./patches
RUN bun install --frozen-lockfile

FROM dependencies AS builder
COPY apps/try ./
COPY src/components/try /repo/src/components/try
COPY src/components/theme-provider.tsx /repo/src/components/theme-provider.tsx
COPY src/lib/web-transfer /repo/src/lib/web-transfer
COPY src/lib/utils.ts /repo/src/lib/utils.ts
COPY messages /repo/messages
COPY public/tailcat /repo/public/tailcat
ARG NEXT_PUBLIC_TRY_SHORT_CODE=1
ARG NEXT_PUBLIC_TRY_RENDEZVOUS_URL=https://rendezvous.uniclipboard.app
ENV NEXT_TELEMETRY_DISABLED=1
RUN bun run build

FROM node:24-bookworm-slim@sha256:01d566e8d94d8c619591d78652babfccd3c6992a3dffa9ed5ab39e11cf6c70e9 AS runner
WORKDIR /app
ENV NODE_ENV=production NEXT_TELEMETRY_DISABLED=1 HOSTNAME=0.0.0.0 PORT=3000
COPY --from=builder --chown=node:node /repo/apps/try/.next/standalone ./
COPY --from=builder --chown=node:node /repo/apps/try/.next/static ./.next/static
COPY --from=builder --chown=node:node /repo/apps/try/public ./public
ARG SOURCE_REVISION
LABEL org.opencontainers.image.revision=$SOURCE_REVISION
LABEL org.opencontainers.image.source=https://github.com/UniClipboard/uc-website
USER node
EXPOSE 3000
HEALTHCHECK --interval=30s --timeout=5s --start-period=20s CMD node -e "fetch('http://127.0.0.1:3000/api/health/live').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"
CMD ["node", "server.js"]
