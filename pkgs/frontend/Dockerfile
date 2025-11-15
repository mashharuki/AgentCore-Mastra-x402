# ==============================================================================
# Multi-stage Dockerfile for Next.js 15 + Mastra Frontend Application
# Optimized for AWS ECS Fargate deployment
# ==============================================================================

# ------------------------------------------------------------------------------
# Stage 1: Dependencies - Install all dependencies including devDependencies
# ------------------------------------------------------------------------------
FROM node:22-alpine AS deps

# Install pnpm
RUN corepack enable && corepack prepare pnpm@10.7.0 --activate

# Set working directory
WORKDIR /app

# Copy package manager files
COPY package.json pnpm-lock.yaml* ./

# Install dependencies
# Use --frozen-lockfile to ensure reproducible builds
RUN pnpm install --frozen-lockfile

# ------------------------------------------------------------------------------
# Stage 2: Builder - Build the Next.js application
# ------------------------------------------------------------------------------
FROM node:22-alpine AS builder

# Install pnpm
RUN corepack enable && corepack prepare pnpm@10.7.0 --activate

WORKDIR /app

# Copy dependencies from deps stage
COPY --from=deps /app/node_modules ./node_modules

# Copy application source code
COPY . .

# Set production environment for build optimization
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# Build the Next.js application
# This creates the optimized production build in .next directory
RUN pnpm build

# ------------------------------------------------------------------------------
# Stage 3: Runner - Production runtime with minimal footprint
# ------------------------------------------------------------------------------
FROM node:22-alpine AS runner

# Install dumb-init for proper signal handling (SIGTERM/SIGKILL)
# This ensures graceful shutdowns in ECS
RUN apk add --no-cache dumb-init

WORKDIR /app

# Set production environment
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# Create a non-root user for security best practices
# Running as non-root reduces attack surface
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

# Copy necessary files from builder stage
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static

# Set proper ownership for non-root user
RUN chown -R nextjs:nodejs /app

# Switch to non-root user
USER nextjs

# Expose the port that Next.js runs on
EXPOSE 3000

# Set the port environment variable
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

# Health check for ECS task health monitoring
# Checks if the application is responding on port 3000
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3000/api/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

# Use dumb-init to handle signals properly
# This ensures SIGTERM is correctly handled for graceful shutdowns
ENTRYPOINT ["dumb-init", "--"]

# Start the Next.js production server
# Logs will be written to stdout/stderr as per ECS best practices
CMD ["node", "server.js"]
