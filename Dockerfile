# 1. Base Image
FROM node:20-alpine AS base
RUN npm install -g pnpm

# 2. Dependencies
FROM base AS deps
WORKDIR /app
COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile

# 3. Builder
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
# We need to run Drizzle Generate/Push safely in CI or locally, not just during build 
# However, Next.js build needs to execute. We run `next build`.
ENV NEXT_TELEMETRY_DISABLED 1
ENV BUILD_STANDALONE true
RUN pnpm run build

# 4. Production Runner
FROM base AS runner
WORKDIR /app
ENV NODE_ENV production
ENV NEXT_TELEMETRY_DISABLED 1

# Hugging Face runs on Port 7860
ENV PORT 7860
EXPOSE 7860

# Next.js user setup
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Copy standalone outputs
COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

CMD ["node", "server.js"]
