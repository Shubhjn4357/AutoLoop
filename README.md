---
title: Autoloop
emoji: 📈
colorFrom: red
colorTo: pink
sdk: docker
app_port: 7860
pinned: false
license: mit
---

# 📈 AutoLoop

AutoLoop is an autonomous social automation platform designed for high-performance Instagram interactions. It features a Next.js 15 web dashboard and a Hono-based automation server with a Redis-backed queue system.

## 🚀 Quick Start

### 1. Prerequisites
- **Node.js**: v20 or higher
- **pnpm**: v9 or higher
- **Redis**: Required for the automation server
- **Turso**: Database for state management

### 2. Local Development
```bash
# Install dependencies
pnpm install

# Start the web dashboard
pnpm --filter @autoloop/web dev

# Start the automation server
pnpm --filter @autoloop/server dev
```

---

## 🛠️ Deployment & Environment Sync

We use a custom script to synchronize local `.env` variables directly to Hugging Face Spaces.

### Synchronizing Variables to Hugging Face
To push your local `.env` to a Space without manually typing every variable in the UI:

```bash
# Usage
pnpm run env:push <path-to-env> <repo-id>

# Example
pnpm run env:push apps/server/.env shubhjn/autoloop
```

> [!TIP]
> The script automatically detects sensitive keys (e.g., `TOKEN`, `SECRET`, `KEY`, `DATABASE_URL`) and pushes them as **Secrets**, while others are pushed as **Variables**.

---

## 🏗️ Architecture & CI/CD

AutoLoop uses a **Monorepo** structure managed by `pnpm`.

### Deployment Speed Control
In [.github/workflows/main.yml](.github/workflows/main.yml), you can control the deployment speed:
- Quality checks and tests run by default. To skip them for an urgent deployment, set `SKIP_QUALITY: true` in the file and push.

### Server Communication
- **Web App**: Connects directly to Turso for dashboard state. Browser calls go through Cloudflare same-origin routes under `/api/server/*`, which inject the server-to-server `SERVER_API_KEY`.
- **Automation Server**: A Hono instance running on port `7860`. Protected `/api/*` routes require `x-server-api-key` or an allowed cron secret. Public Meta webhook/OAuth callbacks remain open for Meta.

---

## 🔗 Meta / Facebook Integration

To enable Instagram automation, you must configure a Meta App.

### 1. Meta App Configuration
1.  Create an app on the [Meta for Developers](https://developers.facebook.com/) portal.
2.  Add the **Instagram Graph API** product.
3.  Set the **Webhook URL** to: `https://your-space-url.hf.space/api/webhook/instagram`
4.  Set the **Verify Token** (matching your `META_VERIFY_TOKEN`).

### 2. Required Environment Variables
Ensure these are set in your server environment:
- `META_APP_ID`: Your Facebook App ID.
- `META_APP_SECRET`: Your Facebook App Secret.
- `META_VERIFY_TOKEN`: A secret string you choose to verify webhooks.
- `META_GRAPH_VERSION`: Current Graph API version, for example `v25.0`.
- `SERVER_API_KEY`: A secure key to authenticate requests from your web app.
- `SERVER_BASE_URL`: Your Hugging Face Space URL, for example `https://shubhjn-autoloop.hf.space`.
- `NEXT_PUBLIC_APP_URL`: Your Cloudflare app URL, for OAuth redirects back to the dashboard.

The app requests `pages_manage_metadata` during Facebook Login because Page webhook subscription uses the Page subscription endpoint. It stores the returned Page access token for Instagram media, publishing, and messaging calls.

---

## 🐳 Docker Production Build

The server is optimized for Hugging Face Spaces using a multi-stage Docker build.
- **Base**: Node 20-slim
- **Port**: 7860
- **Internal Storage**: Redis is bundled within the container for lightweight automation queues.

---

## 📄 License
MIT License - Copyright (c) 2026 shubhjn
