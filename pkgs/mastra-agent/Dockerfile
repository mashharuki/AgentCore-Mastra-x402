# ==============================================================================
# Multi-stage Dockerfile for Mastra AI Agent
# Optimized for Amazon Bedrock AgentCore Runtime (ARM64, Port 8080)
# ==============================================================================

# ------------------------------------------------------------------------------
# Stage 1: Dependencies
# ------------------------------------------------------------------------------
FROM --platform=linux/arm64 node:22-alpine AS deps

# Install pnpm
RUN corepack enable && corepack prepare pnpm@10.7.0 --activate

WORKDIR /app

# Copy package files
COPY package.json ./

# Install dependencies (without lockfile for monorepo compatibility)
RUN pnpm install --no-lockfile

# ------------------------------------------------------------------------------
# Stage 2: Builder
# ------------------------------------------------------------------------------
FROM --platform=linux/arm64 node:22-alpine AS builder

# Install pnpm
RUN corepack enable && corepack prepare pnpm@10.7.0 --activate

WORKDIR /app

# Copy dependencies
COPY --from=deps /app/node_modules ./node_modules

# Copy source code
COPY . .

# Build TypeScript
ENV NODE_ENV=production
RUN pnpm build

# ------------------------------------------------------------------------------
# Stage 3: Runner - Production runtime
# ------------------------------------------------------------------------------
FROM --platform=linux/arm64 node:22-alpine AS runner

# Install dumb-init for proper signal handling (SIGTERM/SIGKILL)
RUN apk add --no-cache dumb-init

WORKDIR /app

# Set production environment
ENV NODE_ENV=production

# Create non-root user for security
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 agentuser

# Copy built application
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json

# Set proper ownership
RUN chown -R agentuser:nodejs /app

# Switch to non-root user
USER agentuser

# Expose port 8080 as required by AgentCore Runtime
EXPOSE 8080

# Set AgentCore Runtime required environment variables
ENV PORT=8080
ENV HOST=0.0.0.0
ENV NODE_ENV=production
# Use Bedrock models in production
ENV USE_GEMINI=true
# Default AWS region (can be overridden at runtime)
ENV AWS_REGION=ap-northeast-1
# MCP_SERVER_URL will be set at runtime through container environment variables
# or injected through a configuration mechanism

# Health check for /ping endpoint
HEALTHCHECK --interval=30s --timeout=5s --start-period=30s --retries=3 \
  CMD node -e "require('http').get('http://localhost:8080/ping', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

# Use dumb-init to handle signals properly
ENTRYPOINT ["dumb-init", "--"]

# Start the agent server
CMD ["node", "dist/server.js"]
