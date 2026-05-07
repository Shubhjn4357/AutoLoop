# AutoLoop Architecture Redesign - Complete

## Summary

The AutoLoop app has been completely redesigned from a complex node-based flow builder to a simplified, Cloudflare-native queue-based automation system.

## What Was Changed

### 1. Database Schema (`src/lib/db/schema.ts`)

**Simplified Automations Table:**
- Removed `flowJson` - no more complex node-based flows
- Added `targetPostId` - direct post/story targeting
- Added `followUp2Template` & `followUp2DelayMinutes` - 2-step follow-up sequence
- Added `aiEnabled` & `aiPrompt` - AI smart reply support
- Added `cooldownMinutes` & `maxDailySends` - rate limiting per automation
- Added `priority` - execution priority ordering

**New Tables:**
- `eventQueue` - distributed event processing queue
- `rateLimitState` - per-account rate limiting tracking
- `analyticsEvents` - comprehensive event analytics
- `aiConversations` - AI conversation context/memory

### 2. Queue-Based Engine (`src/lib/queue/engine.ts`)

**Key Features:**
- **Queue-first architecture** - webhooks immediately queue events, then return fast
- **Idempotency** - duplicate event prevention using unique keys
- **Exponential backoff retry** - 1min, 2min, 4min, 8min delays before failing
- **Per-account rate limiting** - 15 DMs/minute, 150/hour, 500/day + cooldown per user
- **AI integration** - smart replies with conversation context
- **Follow-gated system** - only respond to followers (optional)

**Functions:**
- `queueEvent()` - add events to queue
- `processWebhookEvent()` - convert webhooks to queued events
- `processQueuedEvent()` - process individual events
- `processScheduledMessages()` - handle follow-ups
- `processQueueBatch()` - cron endpoint for batch processing

### 3. Webhook Handler (`src/app/api/webhook/instagram/route.ts`)

**Redesigned to be queue-first:**
- Immediately queues events for async processing
- Returns HTTP 200 fast (required by Meta)
- Never processes synchronously (prevents timeouts)

### 4. Simplified Automation UI (`src/components/automation/simple-automation-builder.tsx`)

**Removed:**
- Complex drag-and-drop node builder
- react-dnd dependencies
- Visual flow canvas

**New 5-Step Wizard:**
1. **Trigger** - Choose: DM, Comment, Story Reply, Mention, or Follow
2. **Condition** - Match: Any, Contains, Equals, Starts/Ends with, Regex
3. **Response** - DM template, optional link, follow-up sequence
4. **Advanced** - AI smart reply, follower check, rate limits
5. **Review** - Preview and activate

**Features:**
- Variable interpolation: `{{first_name}}`, `{{name}}`, `{{username}}`, `{{last_message}}`
- Two follow-up messages with configurable delays
- AI-powered smart replies with custom prompts
- Real-time preview

### 5. AI Integration (`src/lib/ai.ts`)

**Enhanced Functions:**
- `generateSmartReply()` - contextual AI replies with conversation memory
- `detectIntent()` - classify messages (inquiry, pricing, support, etc.)
- `analyzeSentiment()` - positive/negative/neutral detection

### 6. Cron Processing (`.github/workflows/cron-followups.yml`)

**Updated:**
- Runs every minute (instead of 5-min loop)
- Simpler single-step workflow
- Processes both scheduled messages and queue events

## Files Removed

- `src/lib/automation/engine.ts` - replaced by queue engine
- `src/components/automation/automation-builder.tsx` - replaced by simple builder
- `src/app/dashboard/automations/automations-workspace.tsx` - replaced by simple builder

## Files Modified

- `src/lib/db/schema.ts` - new simplified schema
- `src/lib/queue/engine.ts` - new queue engine (new file)
- `src/app/api/webhook/instagram/route.ts` - queue-based handler
- `src/app/api/automation/followups/route.ts` - batch processing
- `src/app/api/ai/suggest-reply/route.ts` - updated for new AI signature
- `src/app/dashboard/automations/page.tsx` - uses new builder
- `src/components/automation/simple-automation-builder.tsx` - new UI (new file)
- `src/lib/ai.ts` - enhanced AI functions
- `.github/workflows/cron-followups.yml` - simplified cron

## Test Files Updated

- `__tests__/automation_engine.test.ts` - tests for queue engine
- `__tests__/components/automation-builder.test.tsx` - tests for simple builder

## Environment Variables Required

```env
# Existing
DATABASE_URL=
META_APP_ID=
META_APP_SECRET=
META_VERIFY_TOKEN=
AUTOMATION_CRON_SECRET=

# For new architecture
APP_URL=https://your-app.com  # Used by GitHub Actions
GOOGLE_GENERATIVE_AI_API_KEY=  # For AI features (optional)
```

## Next Steps

### 1. Database Migration

Run the database push to create new tables:

```bash
pnpm db:push
```

### 2. Update GitHub Actions Secret

Add the `APP_URL` secret to your GitHub repository:
- Go to Settings → Secrets and variables → Actions
- Add `APP_URL` with your deployed app URL

### 3. Deploy

Deploy to Cloudflare:

```bash
pnpm deploy
```

### 4. Test Webhooks

1. Connect Instagram account in dashboard
2. Create a simple automation (DM trigger → contains "hello" → reply "Hi there!")
3. Send a DM to your Instagram account with "hello"
4. Check Notifications in dashboard for processing status

## Architecture Benefits

| Before | After |
|--------|-------|
| Node-based flow builder (complex) | 5-step wizard (simple) |
| Synchronous webhook processing | Queue-based async processing |
| No idempotency | Duplicate prevention |
| No retry mechanism | Exponential backoff retry |
| Basic rate limiting | Per-account + per-user rate limits |
| No AI integration | Smart replies with context |
| Flow-based state | Simplified follow-up sequence |

## Monitoring

The system now tracks:
- Events queued/processed/failed
- DM send rates per account
- AI intent detection
- Follow-gate compliance
- Retry attempts

All tracked in `analyticsEvents` table for dashboard visualization.
