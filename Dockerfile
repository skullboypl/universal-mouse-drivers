# UMD — CapRover / Docker (Next.js standalone)
FROM node:22-alpine AS deps
WORKDIR /app
COPY web/package.json web/package-lock.json ./
RUN npm ci

FROM node:22-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY web/ .
COPY data/umd-store.seed.json ./data/umd-store.seed.json
ENV NEXT_TELEMETRY_DISABLED=1
ENV DATA_DIR=/app/data
RUN npm run build

FROM node:22-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
ENV HOSTNAME=0.0.0.0
ENV DATA_DIR=/app/data

RUN addgroup -S nodejs && adduser -S nextjs -G nodejs \
  && mkdir -p /app/data/downloads \
  && chown -R nextjs:nodejs /app/data

COPY --from=builder /app/public ./public
COPY --from=builder /app/data/umd-store.seed.json ./data-seed/umd-store.json
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs
EXPOSE 3000
CMD ["node", "server.js"]
