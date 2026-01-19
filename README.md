---
title: AutoLoop
emoji: ➰
colorFrom: blue
colorTo: indigo
sdk: docker
pinned: false
app_port: 7860
---

# AutoLoop - Automated Cold Email Outreach Platform

![AutoLoop Banner](https://res.cloudinary.com/dj3a0ww9n/image/upload/v1768761786/workflow_uschkg.png)

**AutoLoop** is an intelligent, production-ready cold email outreach platform designed to automate the entire lead generation and engagement process. It combines **Google Maps scraping**, **AI-powered personalization**, and **visual workflow automation** to help you find, qualify, and convert your ideal customers.

Key capabilities include continuous lead sourcing, smart email drafting with Google Gemini AI, and managing complex outreach sequences via a drag-and-drop editor.

---

## 🚀 Key Features


### 🔍 Smart Lead Scraping

Automatically scrape businesses from Google Maps based on keywords and location. Extract valid emails, phone numbers, and websites to build your lead database.

<img src="https://res.cloudinary.com/dj3a0ww9n/image/upload/v1768761785/scarpper_orbr6v.png" alt="AutoLoop Scraper Interface" width="100%" />


### 🎨 Visual Workflow Builder

Design complex automation flows with a simple drag-and-drop node editor. Connect triggers (e.g., "New Lead Found") to actions (e.g., "Send Email", "Wait 2 Days").
<img src="https://res.cloudinary.com/dj3a0ww9n/image/upload/v1768761786/workflow_uschkg.png" alt="AutoLoop Workflow Builder" width="100%" />


### 🧠 AI Personalization

Leverage **Google Gemini 2.0 Flash** to generate hyper-personalized email drafts based on the prospect's business type, website content, and your specific offer.


### 📧 Gmail Integration

Connect your Gmail account via OAuth to send emails directly from your own address, ensuring high deliverability and trust.


### 📊 Advanced Analytics

Track open rates, click-through rates, and response rates in real-time. Monitor your campaign performance with detailed charts and funnels.

---

## 🛠️ Tech Stack

Built with a modern, type-safe stack for performance and reliability:

- **Framework**: Next.js 15 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS 4 + Shadcn UI
- **Database**: PostgreSQL (Neon) + Drizzle ORM
- **Authentication**: NextAuth.js v5 (Google OAuth)
- **AI**: Google Gemini API
- **Queue/Jobs**: Redis + BullMQ (Background processing)
- **Scraping**: Puppeteer + Cheerio
- **Visuals**: ReactFlow, Recharts, Framer Motion

---

## 📦 Installation & Setup


### Prerequisites

- **Node.js 18+**

- **pnpm** (recommended) or npm
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
   Create a `.env` file in the root directory (see [Environment Variables](#-environment-variables) below).

4. **Setup Database**
   ```bash
   pnpm db:push
   ```


5. **Run Development Server**
   ```bash
   pnpm dev
   ```

   The app will run at `http://localhost:3000`.

6. **Start Background Workers** (Required for scraping & sending emails)
   Open a new terminal configuration and run:
   ```bash
   pnpm worker
   ```


---

## 🔐 Environment Variables

Create a `.env` file with the following keys:

```env
# Database (Neon/Postgres)
DATABASE_URL="postgresql://user:password@host/dbname?sslmode=require"

# NextAuth Configuration
NEXTAUTH_URL="http://localhost:3000" # Use your production URL in deployment
NEXTAUTH_SECRET="your-super-secret-key"

# Google OAuth & Gmail API
GOOGLE_CLIENT_ID="your-google-client-id"
GOOGLE_CLIENT_SECRET="your-google-client-secret"

# Google AI (Gemini)
GEMINI_API_KEY="your-gemini-api-key"

# Redis (Queue)
REDIS_URL="redis://localhost:6379"

# Webhooks (Optional)
WEBHOOK_URL="https://your-domain.com/api/webhooks/email"

# Hugging Face
HF_TOKEN="your-huggingface-token"
```

---

## 🌐 Deployment


### Hugging Face Spaces

This application is configured for deployment on Hugging Face Spaces (Docker).

**Live Demo**: [https://shubhjn-autoloop.hf.space](https://shubhjn-autoloop.hf.space)

Current `NEXTAUTH_URL` for production: `https://shubhjn-autoloop.hf.space`

---

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

---

Made with ❤️ by **Shubh Jain**

<img src="/public/thumbnails/workflow.png" alt="AutoLoop Workflow Builder" width="100%" />