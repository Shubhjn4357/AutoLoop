---
title: AutoLoop
emoji: ➰
colorFrom: blue
colorTo: indigo
sdk: docker
pinned: false
app_port: 7860
---

## AutoLoop - Automated Cold Email & Social Outreach Platform

![AutoLoop Banner](https://res.cloudinary.com/dj3a0ww9n/image/upload/v1768761786/workflow_uschkg.png)

**AutoLoop** is an intelligent, production-ready automation platform designed to streamline lead generation and engagement. It combines **multi-source scraping** (Google Maps, LinkedIn), **AI-powered personalization**, and **visual workflow automation** to help you find, qualify, and convert your ideal customers across multiple channels.

Key capabilities include continuous lead sourcing, smart email drafting with Google Gemini AI, LinkedIn automation, and managing complex outreach sequences via a drag-and-drop editor.

---

## 🚀 Key Features

### 🔍 Smart Lead Scraping
- **Google Maps**: Automatically scrape businesses based on keywords and location. Extract valid emails, phone numbers, and websites.
- **LinkedIn Integration**: Scrape profiles using Google Search heuristics and automate messages via Puppeteer (simulated browsing).

### 🎨 Visual Workflow Builder
Design complex automation flows with a drag-and-drop node editor.
- **Triggers**: Schedule-based or Event-based (e.g., "New Lead Found").
- **Actions**: Send Email, Send WhatsApp, API Request, Scraper Action.
- **Logic**: Conditionals, A/B Testing, Delays, Merges, Loops.
- **Persistence**: Workflows save variable state between executions, enabling long-running multi-step sequences.

### 🧠 AI & Personalization
- **Google Gemini 2.0**: Generate hyper-personalized email drafts based on prospect data and website content.
- **Dynamic Variables**: Use `{{business.name}}`, `{{business.website}}`, etc., in your templates.

### 📧 Email Mastery
- **Gmail Integration**: Send emails from your own account via OAuth.
- **Delivery Tracking**: Real-time tracking of Opens and Clicks via pixel injection and link wrapping.
- **Rate Limiting**: Built-in protection to prevent spam flagging (e.g., max 50 emails/day per account).
- **Bounce Handling**: Automatic detection and handling of failed deliveries.

### 📊 Real-Time Analytics Dashboard
- **Execution Monitoring**: Watch workflows run in real-time.
- **Success/Failure Rates**: Identify bottlenecks in your automation.
- **Quota Tracking**: Monitor your email sending limits and remaining quota.
- **Export**: Download execution logs as CSV for offline analysis.

### 📱 Unified Social Suite
- **LinkedIn**: Automate connection requests and messages.
- **Instagram / Facebook**: Dashboard for scheduling Posts & Reels (Integration ready).

---

## 🛠️ Architecture & Scalability

AutoLoop is built for reliability and scale:

- **Horizontal Scaling**: Separated Web Server and Worker processes.
- **Queue System**: **Redis + BullMQ** powers a robust job queue for critical tasks (Sending emails, Scraping, Workflow execution).
- **Self-Healing**: Automatic retry logic with exponential backoff for failed tasks.
- **Monitoring**: Self-ping mechanism to ensure worker uptime on container platforms.

### Tech Stack
- **Framework**: Next.js 15 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS 4 + Shadcn UI
- **Database**: PostgreSQL (Neon) + Drizzle ORM
- **Authentication**: NextAuth.js v5 (Google OAuth)
- **AI**: Google Gemini API
- **Worker**: Node.js dedicated process

---

## 📦 Installation & Setup

### Prerequisites
- **Node.js 18+**
- **pnpm** (recommended)
- **PostgreSQL Database** (e.g., Neon)
- **Redis Instance** (Local or Upstash)
- **Google Cloud Project** (Enabled Gmail API & OAuth credentials)

### Quick Start

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/autoloop.git
   cd autoloop
   ```

2. **Install dependencies**
   ```bash
   pnpm install
   ```

3. **Configure Environment**
   Create a `.env` file in the root directory (see [Environment Variables](#-environment-variables)).

4. **Setup Database**
   ```bash
   pnpm db:push
   # Optional: Seed sample data
   npx tsx scripts/seed-data.ts
   ```

5. **Run Development Server**
   ```bash
   pnpm dev
   ```
   The web app will run at `http://localhost:3000`.

6. **Start Background Workers** (Critical for automation)
   Open a separate terminal and run:
   ```bash
   pnpm worker
   ```
   *Note: This starts the dedicated worker process that handles queued jobs and scraping.*

---

## 🔐 Environment Variables

Create a `.env` file with the following keys:

```env
# Database (Neon/Postgres)
DATABASE_URL="postgresql://..."

# NextAuth Configuration
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-super-secret-key"

# Google OAuth & Gmail API
GOOGLE_CLIENT_ID="..."
GOOGLE_CLIENT_SECRET="..."

# Google AI (Gemini)
GEMINI_API_KEY="..."

# Redis (Queue)
REDIS_URL="redis://localhost:6379"

# App URL (For Self-Ping & Webhooks)
NEXT_PUBLIC_APP_URL="http://localhost:3000"

# Hugging Face (Optional)
HF_TOKEN="..."

# Admin Credentials (for seed/testing)
ADMIN_EMAIL="admin@example.com"
```

---

## 🌐 Deployment

### Hugging Face Spaces / Docker
This repo includes a `Dockerfile` and is configured for Hugging Face Spaces.

**Important for Cloud Deployment:**
1. **Worker Process**: Ensure your deployment platform runs `scripts/worker.ts`. In Docker, you might use a process manager like `pm2` or run the worker in a separate container/service.
2. **Keep-Alive**: The worker includes a self-ping mechanism. Ensure `NEXT_PUBLIC_APP_URL` is set to your production URL (e.g., `https://my-app.hf.space`) so the ping hits the public route and keeps the container active.

**Live Demo**: [https://shubhjn-autoloop.hf.space](https://shubhjn-autoloop.hf.space)

---

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

Made with ❤️ by **Shubh Jain**
