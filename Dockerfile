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

# Enable Corepack and pnpm
RUN corepack enable && corepack prepare pnpm@9.1.2 --activate

# =============================================================================
# Dependencies stage - install production dependencies
# =============================================================================
FROM base AS deps

COPY app/package.json app/pnpm-lock.yaml ./

RUN pnpm install --frozen-lockfile --prod

# =============================================================================
# Builder stage - build application
# =============================================================================
FROM base AS builder

WORKDIR /app

COPY app/package.json app/pnpm-lock.yaml ./

RUN pnpm install --frozen-lockfile

# Copy Prisma schema before generating the client
COPY app/prisma ./prisma/

# Generate Prisma Client
RUN pnpm prisma generate

# Copy application source
COPY app/. .

# Generate Prisma Client again after all application files are present
RUN pnpm prisma generate

# Build application
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
    openssl \
    && addgroup -g 1001 -S nodejs \
    && adduser -S nodejs -u 1001 -G nodejs

WORKDIR /app

# Copy production dependencies
COPY --from=deps --chown=nodejs:nodejs /app/node_modules ./node_modules

# Copy generated Prisma Client from builder
COPY --from=builder --chown=nodejs:nodejs /app/node_modules/.prisma ./node_modules/.prisma

# Copy Prisma package/client files if generated dependencies require them
COPY --from=builder --chown=nodejs:nodejs /app/node_modules/@prisma ./node_modules/@prisma

# Copy built application
COPY --from=builder --chown=nodejs:nodejs /app/dist ./dist

# Copy package.json
COPY --from=builder --chown=nodejs:nodejs /app/package.json ./package.json

# Copy Prisma schema
COPY --from=builder --chown=nodejs:nodejs /app/prisma ./prisma

# Create uploads directory with correct permissions
RUN mkdir -p /app/public/uploads \
    && chown -R nodejs:nodejs /app/public/uploads

# Switch to non-root user
USER nodejs

# Expose application port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
    CMD wget -q --spider http://localhost:3000/healthz || exit 1

# Use dumb-init to handle signals properly
ENTRYPOINT ["dumb-init", "--"]

CMD ["node", "dist/server.js"]
