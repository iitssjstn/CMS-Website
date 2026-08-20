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

# Enable corepack for pnpm
RUN corepack enable && corepack prepare pnpm@latest --activate

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

# Copy built application
COPY --from=builder --chown=nodejs:nodejs /app/dist ./dist
COPY --from=builder --chown=nodejs:nodejs /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=deps --chown=nodejs:nodejs /app/node_modules ./node_modules
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
