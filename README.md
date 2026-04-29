---
title: AutoLoop
emoji: ➰
colorFrom: blue
colorTo: indigo
sdk: docker
pinned: false
app_port: 7860
---

## AutoLoop Instagram Automation

AutoLoop is a fast, Edge-ready SaaS that handles Instagram messaging through Meta Graph API utilizing Node webhook handlers.

## 🚀 Running Locally

Requirements:

- Node.js 20+
- Turso Database Instance
- Meta Developer Account (for Instagram access)

1. Clone the repository and execute `pnpm install`.
2. Map out your `.env` following `.env.local` defaults.
3. Push the SQL Schema to Turso: `pnpm exec drizzle-kit push`
4. Spin up the diagnostic check ensuring your routes work: `pnpm run doctor`
5. Run the dev server `pnpm dev`.

## 📦 Hugging Face Deployment

This branch is uniquely configured to port cleanly into a **Hugging Face Docker Space**.
Hugging Face strictly utilizes **Port 7860**. Our `Dockerfile` runs the multi-stage build exposing this exact port for node proxy.

### Setup Instructions

1. Create a `Docker` Space inside Hugging Face.
2. In your Github Repository, establish Two Repository Secrets:
   - `HF_TOKEN`: Sourced from your Hugging Face Settings -> Access Tokens.
   - `HF_SPACE_ID`: Should look like `your-username/space-name`
3. On every push to `main`, GitHub Actions will verify tests internally via vitest, then pipe the master branch straight to HF executing your Docker configuration.

> **Note:** You must place ALL `.env` keys referenced in `scripts/doctor.ts` manually into the Hugging Face Space Settings under **Variables and secrets**.
