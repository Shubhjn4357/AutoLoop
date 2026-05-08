# Builder stage
FROM node:20-slim AS builder

WORKDIR /app

# Install pnpm
RUN npm install -g pnpm

# Copy workspace files
COPY pnpm-lock.yaml pnpm-workspace.yaml package.json ./
COPY apps/server/package.json ./apps/server/
COPY packages/db/package.json ./packages/db/
COPY packages/types/package.json ./packages/types/
COPY packages/shared/package.json ./packages/shared/

# Install dependencies
RUN pnpm install --frozen-lockfile

# Copy source code
COPY apps/server ./apps/server
COPY packages ./packages

# Build the server and shared packages
RUN pnpm --filter @autoloop/server build

# Production stage
FROM node:20-slim

WORKDIR /app

# Install Redis
RUN apt-get update && apt-get install -y redis-server && rm -rf /var/lib/apt/lists/*

# Copy from builder
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/packages ./packages
COPY --from=builder /app/apps/server ./apps/server

# Ensure start script is executable
RUN chmod +x apps/server/start.sh

EXPOSE 7860

ENV NODE_ENV=production
ENV PORT=7860
ENV REDIS_HOST=localhost
ENV REDIS_PORT=6379

# Use absolute path for start script or set WORKDIR correctly
CMD ["/bin/sh", "/app/apps/server/start.sh"]
