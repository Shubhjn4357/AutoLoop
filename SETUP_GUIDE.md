# AutoLoop Setup Guide

This guide explains how to set up and run the decoupled AutoLoop platform (Frontend + Automation Server).

## Architecture

- **`apps/web`**: Next.js frontend (Cloudflare Pages).
- **`apps/server`**: Hono automation backend (Hugging Face Docker Space).
- **`packages/db`**: Shared Drizzle ORM / SQLite (Turso).
- **`packages/shared`**: Shared logic (Instagram Graph, AI, etc.).
- **`packages/types`**: Shared TypeScript definitions.

---

## Local Development

### 1. Prerequisites
- Node.js 20+
- pnpm 9+
- Docker & Docker Compose
- [Optional] Ngrok (for local webhook testing)

### 2. Environment Variables

Create `.env` files in `apps/web` and `apps/server`. Use the provided `.env.example` in each folder as a template.

**Crucial Variables:**
- `DATABASE_URL`: Turso DB URL.
- `DATABASE_AUTH_TOKEN`: Turso Auth Token.
- `SERVER_API_KEY`: A shared secret between web and server.
- `SERVER_BASE_URL`: `https://shubhjn-autoloop.hf.space` (Production) or `http://localhost:3001` (Local).
- `GOOGLE_GENERATIVE_AI_API_KEY`: For Gemini AI features.
- `META_APP_ID`, `META_APP_SECRET`: For Instagram integration.

### 3. Run with Docker (Recommended)
This starts the Hono server and a local Redis container.

```bash
pnpm docker:dev
```

### 4. Run Frontend
In a new terminal:

```bash
cd apps/web
pnpm dev
```

---

## Deployment

### 1. Automation Server (Hugging Face)
- Create a new Docker Space on Hugging Face.
- Push the contents of `apps/server` or the whole monorepo (the Dockerfile in `apps/server` handles the build).
- Use the `env:push` script to sync your local `.env` to HF:
  ```bash
  export HF_TOKEN=your_token
  pnpm env:push apps/server/.env your-username/your-space-id
  ```

### 2. Web Frontend (Cloudflare)
- Connect your repo to Cloudflare Pages.
- Build command: `pnpm build` (Turbo will handle the monorepo build).
- Output directory: `apps/web/.next` (if using Next.js adapter) or `apps/web/out`.

---

## Webhook Testing
1. Use Ngrok to expose port 3001: `ngrok http 3001`.
2. Update your Facebook App Webhook URL to: `https://your-ngrok.io/api/webhook/instagram`.
3. Verify token: Set `INSTAGRAM_VERIFY_TOKEN` in your `.env`.
