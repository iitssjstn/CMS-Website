# =============================================================================
# Base
# =============================================================================
FROM node:20-alpine AS base

RUN apk add --no-cache \
    python3 \
    make \
    g++ \
    libc6-compat \
    openssl \
    vips-dev \
    postgresql-client

WORKDIR /app

RUN corepack enable \
    && corepack prepare pnpm@9.1.2 --activate

# =============================================================================
# Dependencies
# =============================================================================
FROM base AS deps

COPY app/package.json app/pnpm-lock.yaml ./

RUN pnpm install --frozen-lockfile

# =============================================================================
# Builder
# =============================================================================
FROM base AS builder

WORKDIR /app

# Copy installed dependencies
COPY --from=deps /app/node_modules ./node_modules

# Copy package files
COPY app/package.json app/pnpm-lock.yaml ./

# Copy Prisma schema
COPY app/prisma ./prisma

# Copy application
COPY app/ ./

# Generate Prisma Client
RUN pnpm prisma generate

# Build TypeScript application
RUN pnpm run build

# =============================================================================
# Production
# =============================================================================
FROM node:20-alpine AS production

RUN apk add --no-cache \
    dumb-init \
    vips \
    postgresql-client \
    openssl \
    && addgroup -g 1001 -S nodejs \
    && adduser -S nodejs -u 1001 -G nodejs

WORKDIR /app

# Copy the complete node_modules from the builder.
# This includes the generated Prisma Client.
COPY --from=builder --chown=nodejs:nodejs /app/node_modules ./node_modules

# Copy built application
COPY --from=builder --chown=nodejs:nodejs /app/dist ./dist

# Copy package.json
COPY --from=builder --chown=nodejs:nodejs /app/package.json ./package.json

# Copy Prisma schema
COPY --from=builder --chown=nodejs:nodejs /app/prisma ./prisma

# Create upload directory
RUN mkdir -p /app/public/uploads \
    && chown -R nodejs:nodejs /app/public/uploads

# Run as non-root user
USER nodejs

EXPOSE 3000

HEALTHCHECK \
    --interval=30s \
    --timeout=10s \
    --start-period=40s \
    --retries=3 \
    CMD wget -q --spider http://localhost:3000/healthz || exit 1

ENTRYPOINT ["dumb-init", "--"]

CMD ["node", "dist/server.js"]
