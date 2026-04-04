# ==============================================================================
# Multi-stage Dockerfile for x402 Backend Server
# Optimized for minimal production size
# ==============================================================================

ARG PNPM_VERSION=10.7.0

# ------------------------------------------------------------------------------
# Stage 1: Dependencies
# ------------------------------------------------------------------------------
FROM node:20-alpine AS deps

# Install pnpm
RUN npm install -g pnpm@${PNPM_VERSION}

WORKDIR /app

# Copy package file
COPY package.json ./

# Install all dependencies (including dev dependencies needed for build)
RUN pnpm install --no-lockfile

# ------------------------------------------------------------------------------
# Stage 2: Builder
# ------------------------------------------------------------------------------
FROM node:20-alpine AS builder

# Install pnpm
RUN npm install -g pnpm@${PNPM_VERSION}

WORKDIR /app

# Copy dependencies from deps stage
COPY --from=deps /app/node_modules ./node_modules

# Copy source code
COPY . .

# Build TypeScript
ENV NODE_ENV=production
RUN pnpm run build

# ------------------------------------------------------------------------------
# Stage 3: Runner - Production runtime
# ------------------------------------------------------------------------------
FROM node:20-alpine AS runner

# Install dumb-init for proper signal handling
RUN apk add --no-cache dumb-init

WORKDIR /app

# Copy only production dependencies
COPY --from=deps /app/package.json ./
RUN npm install -g pnpm@${PNPM_VERSION} && \
    pnpm install --prod --no-lockfile && \
    pnpm store prune

# Copy built application
COPY --from=builder /app/dist ./dist

# Create non-root user for security
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001 && \
    chown -R nodejs:nodejs /app

USER nodejs

# Expose port
EXPOSE 4021

# Use dumb-init to handle signals properly
ENTRYPOINT ["dumb-init", "--"]

# Run the application
CMD ["node", "dist/index.js"]
