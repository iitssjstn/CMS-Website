# Base
FROM node:20-alpine AS base
RUN apk add --no-cache python3 make g++ libc6-compat openssl vips-dev postgresql-client
WORKDIR /app
RUN corepack enable && corepack prepare pnpm@9.1.2 --activate

# Dependencies
FROM base AS deps
COPY app/package.json app/pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile --prod

# Build
FROM base AS builder
COPY app/package.json app/pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile
COPY app/prisma ./prisma/
RUN pnpm prisma generate
COPY app/. .
RUN pnpm run build
RUN pnpm prune --prod

# Runtime
FROM node:20-alpine AS production
RUN apk add --no-cache dumb-init vips postgresql-client su-exec     && addgroup -g 1001 -S nodejs     && adduser -S nodejs -u 1001 -G nodejs
WORKDIR /app
COPY --from=builder --chown=nodejs:nodejs /app/dist ./dist
COPY --from=builder --chown=nodejs:nodejs /app/node_modules ./node_modules
COPY --from=builder --chown=nodejs:nodejs /app/package.json ./package.json
COPY --from=builder --chown=nodejs:nodejs /app/prisma ./prisma
RUN mkdir -p /app/public/uploads && chown -R nodejs:nodejs /app/public/uploads
USER nodejs
EXPOSE 3000
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3     CMD wget -q --spider http://localhost:3000/healthz || exit 1
ENTRYPOINT ["dumb-init", "--"]
CMD ["node", "dist/server.js"]
