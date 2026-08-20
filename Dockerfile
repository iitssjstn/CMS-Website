# =============================================================================
# Base stage - shared dependencies
# =============================================================================
FROM node:20-alpine AS base

# Install system dependencies for Prisma, sharp, argon2
RUN apk add --no-cache \
    python3 \
    make \
    g++ \
    libc6-compat \
    openssl \
    vips-dev \
    postgresql-client

WORKDIR /app

# Enable corepack for pnpm (pinned to match package.json's "packageManager"
# field — "pnpm@latest" would silently drift to newer major versions with
# incompatible lockfile formats and break --frozen-lockfile installs)
RUN corepack enable && corepack prepare pnpm@9.1.2 --activate

# =============================================================================
# Dependencies stage - install production deps only
# =============================================================================
FROM base AS deps

COPY app/package.json app/pnpm-lock.yaml* ./
RUN pnpm install --frozen-lockfile --prod

# =============================================================================
# Builder stage - build application
# =============================================================================
FROM base AS builder

COPY app/package.json app/pnpm-lock.yaml* ./
RUN pnpm install --frozen-lockfile

COPY app/prisma ./prisma/
RUN pnpm prisma generate

COPY app/. .
RUN pnpm run build
RUN pnpm prune --prod

# =============================================================================
# Production stage - minimal runtime image
# =============================================================================
FROM node:20-alpine AS production

# Install runtime dependencies only
RUN apk add --no-cache \
    dumb-init \
    vips \
    postgresql-client \
    su-exec \
    && addgroup -g 1001 -S nodejs \
    && adduser -S nodejs -u 1001 -G nodejs

WORKDIR /app

# Copy built application and the generated dependency tree. Keeping these
# together preserves pnpm's symlinks and includes the generated Prisma client.
COPY --from=builder --chown=nodejs:nodejs /app/dist ./dist
COPY --from=builder --chown=nodejs:nodejs /app/node_modules ./node_modules
COPY --from=builder --chown=nodejs:nodejs /app/package.json ./package.json
COPY --from=builder --chown=nodejs:nodejs /app/prisma ./prisma

# Create uploads directory with correct permissions
RUN mkdir -p /app/public/uploads && chown -R nodejs:nodejs /app/public/uploads

# Switch to non-root user
USER nodejs

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
    CMD wget -q --spider http://localhost:3000/healthz || exit 1

# Use dumb-init to handle signals properly
ENTRYPOINT ["dumb-init", "--"]
CMD ["node", "dist/server.js"]
