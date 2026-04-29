So you want to build an Instagram automation SaaS on a free Hugging Face server… bold. Instagram’s legal team is probably already stretching. Anyway, let’s design this properly so it doesn’t collapse the moment one user logs in.

Below is a **production-grade `.md blueprint`** you can hand to an AI agent or use yourself.

---

# 📄 `AUTOLOOP.md` — Master Build Plan

## 🧠 Overview

**App Name:** AutoLoop
**Goal:** Instagram automation platform allowing users to:

* Connect Instagram account
* Configure auto-replies, triggers, templates
* Run continuously via server-side execution
* Manage conversations & automation flows

**Core Problem:**
Instagram does NOT officially allow full DM automation for personal accounts. Only **Meta Graph API (Instagram Business)** supports limited messaging automation.

👉 Translation:
If you try to fake it with scraping or reverse APIs, your app will get rate-limited, banned, or just implode.

**Recommended Approach (Realistic):**

* Use **Instagram Graph API (Business accounts only)**
* Use webhook-based event system
* Avoid polling-heavy architecture

---

## ⚙️ Tech Stack

```txt
Frontend:
- Next.js 15 (App Router)
- React 19
- TypeScript

Backend:
- Next.js Server Actions + Route Handlers
- Edge + Node hybrid execution

Auth:
- Auth.js (Google Provider)

Database:
- Turso (SQLite edge DB)
- Drizzle ORM

UI:
- shadcn/ui
- TailwindCSS
- lucide-react icons

Infra:
- Hugging Face Spaces (Node container)
- Optional: cron via internal loop

State:
- React Server Components + Client hooks

Performance:
- Suspense + streaming
- Dynamic rendering
```

---

## 🏗️ Architecture

```txt
Client (Next.js UI)
   ↓
Server Actions / API Routes
   ↓
Automation Engine (Worker Layer)
   ↓
Instagram Graph API
   ↓
Database (Turso)
```

---

## 🔐 Authentication Flow

```txt
1. User logs in via Google (Auth.js)
2. Session stored (JWT / DB)
3. User connects Instagram via Meta OAuth
4. Store:
   - access_token
   - page_id
   - ig_user_id
```

---

## 📂 Folder Structure (Scalable)

```txt
autoloop/
│
├── app/
│   ├── (auth)/
│   │   ├── login/
│   │   └── signup/
│   │
│   ├── dashboard/
│   │   ├── automations/
│   │   ├── messages/
│   │   ├── analytics/
│   │   └── settings/
│   │
│   ├── api/
│   │   ├── auth/
│   │   ├── instagram/
│   │   ├── automation/
│   │   └── webhook/
│   │
│   ├── layout.tsx
│   └── page.tsx
│
├── components/
│   ├── ui/                # shadcn components
│   ├── shared/
│   ├── automation/
│   ├── forms/
│   └── loaders/
│
├── hooks/
│   ├── useAuth.ts
│   ├── useApi.ts
│   ├── useAutomation.ts
│   ├── useTheme.ts
│   └── useInstagram.ts
│
├── lib/
│   ├── db/
│   │   ├── schema.ts
│   │   └── client.ts
│   │
│   ├── auth/
│   │   └── config.ts
│   │
│   ├── instagram/
│   │   ├── client.ts
│   │   ├── webhook.ts
│   │   └── handlers.ts
│   │
│   ├── automation/
│   │   ├── engine.ts
│   │   ├── rules.ts
│   │   └── executor.ts
│
├── constants/
│   ├── app.ts
│   ├── theme.ts
│   ├── routes.ts
│   ├── messages.ts
│   └── automation.ts
│
├── styles/
│   └── globals.css
│
├── drizzle/
│   └── migrations/
│
└── types/
    ├── user.ts
    ├── automation.ts
    └── instagram.ts
```

---

## 🧱 Database Schema (Drizzle)

```ts
users
- id
- email
- name
- image

accounts
- id
- user_id
- provider
- access_token

instagram_accounts
- id
- user_id
- ig_user_id
- page_id
- access_token

automations
- id
- user_id
- name
- trigger_type
- condition
- response_template
- is_active

messages
- id
- ig_user_id
- sender_id
- text
- timestamp
```

---

## 🔁 Automation Engine

```txt
Trigger Types:
- New message received
- Keyword match
- Time-based

Flow:
Webhook → Parse Event → Match Rule → Execute Action
```

### Example Logic

```ts
if (message.includes("price")) {
  sendReply("Our pricing starts at ₹999 🚀");
}
```

---

## 📡 Instagram Integration

### Required APIs:

* `/me/messages`
* Webhooks (subscription required)
* Pages API

### Webhook Endpoint:

```txt
/api/webhook/instagram
```

### Flow:

```txt
Instagram → Webhook → Verify → Store Message → Trigger Automation
```

---

## ⚡ useApi Hook (Optimized)

```ts
export function useApi() {
  const fetcher = async (url: string, options?: RequestInit) => {
    const res = await fetch(url, {
      ...options,
      credentials: "include",
    });

    if (!res.ok) throw new Error("API Error");
    return res.json();
  };

  return { fetcher };
}
```

---

## 🎨 Theme System (Dark/Light)

```ts
export const theme = {
  light: {
    bg: "#ffffff",
    text: "#0f172a",
    primary: "#6366f1",
  },
  dark: {
    bg: "#0f172a",
    text: "#ffffff",
    primary: "#8b5cf6",
  },
};
```

Use `next-themes` + Tailwind.

---

## 🧩 UI Components (shadcn)

Use:

* Button
* Dialog
* Drawer
* Select
* Input
* Textarea
* Checkbox
* Accordion
* DropdownMenu

---

## 🧠 UX Patterns

* Skeleton loaders everywhere
* Suspense boundaries per section
* Optimistic UI for automation toggles
* Streaming dashboard data

---

## 🚀 Deployment (Hugging Face)

### Reality Check:

Hugging Face is NOT designed for persistent background jobs.

### Workaround:

```txt
Option A:
- Use long-running API route loop

Option B:
- Use webhook-driven only (recommended)

Option C:
- Ping-based keep alive hack (fragile)
```

---

## 🔄 Continuous Execution Strategy

```txt
Avoid:
❌ setInterval loops
❌ polling

Use:
✅ Webhooks
✅ Event-driven execution
```

---

## 🔐 Security

* Encrypt access tokens
* Use HTTP-only cookies
* Rate limit endpoints
* Validate webhook signatures

---

## 📊 Future Features

* AI auto-reply (LLM integration)
* Multi-account support
* Campaign analytics
* Bulk DM (careful, risky)
* Team dashboard

---

## ⚠️ Hard Truths

* Instagram automation is heavily restricted
* Personal accounts = nightmare to automate
* Business API = limited but stable
* Free infra = unreliable for always-on systems

---

## 🧩 Final Strategy Summary

```txt
Build lean.
Use official APIs.
Avoid hacks.
Focus on webhook automation.
Design for scale from day 1.
```

---

You’re basically building a SaaS that sits between user intent and a very grumpy API ecosystem. Respect the constraints or the system will remind you… loudly.

Now go build it before motivation disappears again.
