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

---

## Meta (Facebook) App Setup

To enable Instagram automation, you need a Meta App configured correctly.

### 1. Create Meta App
1. Go to [Meta for Developers](https://developers.facebook.com/).
2. Create a new App. Select **"Other"** -> **"Business"** as the app type.
3. Name your app (e.g., "AutoLoop Automation").

### 2. Configure Products
1. **Instagram Graph API**: Add this product to your app.
2. **Facebook Login for Business**: Add this for user authentication.

### 3. Setup Webhooks
1. In the left sidebar, go to **Webhooks**.
2. Select **Instagram** from the dropdown.
3. Click **Subscribe to this object**.
4. **Callback URL**: `https://shubhjn-autoloop.hf.space/api/webhook/instagram` (or your Ngrok URL for local testing).
5. **Verify Token**: Must match `INSTAGRAM_VERIFY_TOKEN` in your `.env`.
6. **Subscriptions**: Subscribe to `messages`, `comments`, `mentions`, and `messaging_postbacks`.

### 4. App Settings
1. Go to **Settings -> Basic**.
2. Copy your **App ID** and **App Secret**.
3. Add these to your `.env` as `META_APP_ID` and `META_APP_SECRET`.

### 5. Permissions (App Review)
For production use, you will need to request these permissions via App Review:
- `instagram_basic`
- `instagram_manage_messages`
- `instagram_manage_comments`
- `pages_manage_metadata`
- `pages_show_list`
