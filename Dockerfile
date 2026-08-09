# UMD - CapRover / Docker (Next.js standalone)
# CapRover passes app env as --build-arg; declare to silence "not consumed".
# Secrets must NOT be ENV'd from ARG (would bake into image layers).
ARG CAPROVER_GIT_COMMIT_SHA=
ARG ADMIN_USER=
ARG ADMIN_PASSWORD=
ARG ADMIN_SECRET=
ARG DATA_DIR=
ARG HOSTNAME=
ARG NODE_ENV=
ARG PORT=
ARG NEXT_PUBLIC_SITE_URL=

FROM node:22-alpine AS deps
WORKDIR /app
COPY web/package.json web/package-lock.json ./
RUN npm ci

FROM node:22-alpine AS builder
ARG NEXT_PUBLIC_SITE_URL
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY web/ .
COPY data/umd-store.seed.json ./data/umd-store.seed.json
ENV NEXT_TELEMETRY_DISABLED=1
ENV DATA_DIR=/app/data
ENV NEXT_PUBLIC_SITE_URL=$NEXT_PUBLIC_SITE_URL
RUN npm run build

FROM node:22-alpine AS runner
ARG CAPROVER_GIT_COMMIT_SHA
ARG NEXT_PUBLIC_SITE_URL
WORKDIR /app
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
ENV HOSTNAME=0.0.0.0
ENV DATA_DIR=/app/data
ENV NEXT_PUBLIC_SITE_URL=$NEXT_PUBLIC_SITE_URL
ENV CAPROVER_GIT_COMMIT_SHA=$CAPROVER_GIT_COMMIT_SHA

RUN addgroup -S nodejs && adduser -S nextjs -G nodejs \
  && mkdir -p /app/data/downloads \
  && chown -R nextjs:nodejs /app/data

COPY --from=builder /app/public ./public
COPY --from=builder /app/data/umd-store.seed.json ./data-seed/umd-store.json
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
# EV-signed tray ships in the image (persistent /app/data may be empty)
COPY web/bundled-downloads ./bundled-downloads
ENV BUNDLED_DOWNLOADS_DIR=/app/bundled-downloads

USER nextjs
EXPOSE 3000
CMD ["node", "server.js"]
