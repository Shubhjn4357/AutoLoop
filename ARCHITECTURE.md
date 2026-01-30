# Architecture Documentation

## System Overview

AutoLoop is a Next.js 15 based email automation and workflow management system built with enterprise-grade security, caching, and performance optimization.

## Technology Stack

- **Frontend**: React 19.2.3, Next.js 15, TypeScript, Tailwind CSS
- **Backend**: Next.js App Router, NextAuth.js v5, Server Actions
- **Database**: PostgreSQL with Drizzle ORM
- **Cache**: Redis with pattern-based invalidation
- **Task Queue**: BullMQ for background jobs
- **Authentication**: NextAuth.js with OAuth (Google, GitHub), Credentials
- **Validation**: Zod schemas for type-safe validation
- **Error Tracking**: Sentry
- **Monitoring**: Web Vitals, custom performance tracking

## Directory Structure

```
/app                  - Next.js App Router pages and API routes
  /api               - REST API endpoints
  /auth              - Authentication pages
  /dashboard         - Dashboard pages
  /actions           - Server actions

/components          - React components
  /ui               - Base UI components
  /admin            - Admin-only components
  /dashboard        - Dashboard components

/lib                 - Utilities and business logic
  /api-*             - API-related utilities
  /auth-*            - Authentication utilities
  /validation        - Input validation schemas
  /sanitize          - XSS prevention
  /cache-*           - Caching layer
  /rate-limit        - Rate limiting
  /csrf              - CSRF protection
  /logger            - Logging system
  /feature-flags     - Feature management
  /environment-*     - Configuration

/db                  - Database configuration
  /schema            - Drizzle ORM schemas
  /indexes           - Database indexes

/public              - Static assets

/__tests__           - Unit tests
/e2e                 - E2E tests with Playwright

/types               - TypeScript type definitions

/hooks               - Custom React hooks

/styles              - Global styles

/docs                - Documentation
```

## Core Features

### 1. Authentication & Authorization
- **Multi-Provider Support**: Google, GitHub, Credentials, WhatsApp OTP
- **NextAuth.js v5**: Session management with JWT
- **Rate Limiting**: Per-endpoint configuration
- **Brute-Force Protection**: Progressive delays, account lockout
- **CSRF Protection**: Timing-safe token validation
- **API Key Auth**: For external service integrations

### 2. Caching Strategy
- **Redis Cache**: Distributed caching with pattern-based invalidation
- **Query-Level Caching**: 
  - Businesses: 10-minute TTL
  - Workflows: 5-minute TTL
  - Templates: 15-minute TTL
- **Cache Invalidation**: Automatic on mutations (POST/PATCH/DELETE)
- **Cache Bypass**: Support for force-refresh via headers

### 3. Security Measures
- **Input Validation**: Zod schemas for all inputs
- **XSS Prevention**: DOMPurify sanitization
- **SQL Injection Prevention**: Parameterized queries via Drizzle ORM
- **Security Headers**:
  - Content-Security-Policy
  - X-Frame-Options: DENY
  - X-Content-Type-Options: nosniff
  - Referrer-Policy: strict-origin-when-cross-origin
  - Permissions-Policy: camera=(), microphone=(), geolocation=()

### 4. Performance Optimization
- **Code Splitting**: Webpack optimization with vendor separation
- **Dynamic Imports**: Lazy loading of heavy components
- **Database Indexes**: On userId, email, status, createdAt fields
- **Web Vitals Tracking**: LCP, FID, CLS monitoring
- **API Performance**: Response time tracking and slow query logging
- **Bundle Analysis**: @next/bundle-analyzer integration

### 5. Error Handling
- **Global Error Boundary**: Catches component errors
- **API Error Responses**: Standardized format with error codes
- **Sentry Integration**: Error tracking and reporting
- **Detailed Logging**: Structured JSON logs with context

### 6. Database Design

#### Core Tables
- `users`: User accounts and authentication
- `businesses`: Business entities
- `automation_workflows`: Workflow definitions
- `email_templates`: Email templates
- `email_logs`: Sent email tracking
- `business_contacts`: Contact management
- `campaign_analytics`: Campaign metrics

#### Indexes
```sql
-- Users table
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_created_at ON users(created_at);

-- Businesses table
CREATE INDEX idx_businesses_user_id ON businesses(user_id);
CREATE INDEX idx_businesses_email ON businesses(email);
CREATE INDEX idx_businesses_status ON businesses(status);
CREATE INDEX idx_businesses_created_at ON businesses(created_at);

-- Workflows table
CREATE INDEX idx_workflows_user_id ON automationWorkflows(user_id);
CREATE INDEX idx_workflows_is_active ON automationWorkflows(is_active);

-- Email Logs table
CREATE INDEX idx_email_logs_business_id ON emailLogs(business_id);
CREATE INDEX idx_email_logs_status ON emailLogs(status);
CREATE INDEX idx_email_logs_sent_at ON emailLogs(sent_at);
```

## Request Flow

### Authentication Flow
1. User submits login/signup form
2. Form validates input (client-side)
3. POST to `/api/auth/signin` or `/api/auth/signup`
4. Server validates with Zod schemas
5. Rate limiting check
6. Password hashing with bcrypt
7. JWT token generation
8. Session establishment
9. Redirect to dashboard

### API Request Flow
1. Client sends request with auth token and CSRF token
2. Middleware validates request
3. Rate limiting check
4. User authentication verification
5. Check Redis cache (GET requests)
6. Execute business logic
7. Validate output
8. Cache result (if applicable)
9. Return response with performance headers

### Caching Flow
1. Incoming GET request
2. Generate cache key from endpoint + filters
3. Check Redis for cached value
4. If hit: return cached data with X-Cache: hit header
5. If miss: fetch from database
6. Validate response
7. Cache with appropriate TTL
8. Return data with X-Cache: miss header
9. On mutation (PATCH/DELETE): invalidate related cache patterns

## Data Validation Pipeline

1. **Client-Side**: React Hook Form + Zod schemas
2. **Server-Side**: Zod schema validation
3. **Database**: Column constraints and foreign keys
4. **Output**: Response validation before sending to client

## Error Handling Strategy

### Error Levels
- **Client Validation**: Form validation messages
- **Server Validation**: 400 Bad Request with error details
- **Authentication**: 401 Unauthorized with retry instructions
- **Authorization**: 403 Forbidden
- **Rate Limited**: 429 Too Many Requests with Retry-After header
- **Server Error**: 500 with Sentry tracking

### Error Response Format
```json
{
  "success": false,
  "error": "Human-readable error message",
  "code": "ERROR_CODE",
  "details": {
    "field": ["error message"]
  },
  "timestamp": "ISO8601 timestamp"
}
```

## Feature Flags

Located in `lib/feature-flags.ts`:
- Email notifications
- Two-factor authentication (10% rollout)
- Advanced analytics
- AI-powered suggestions (5% rollout)
- New dashboard UI (experimental, 20% rollout)

Flags support:
- Percentage-based rollout
- User whitelisting/blacklisting
- A/B testing groups
- Admin overrides

## Deployment Architecture

### Environment Stages
1. **Development**: Local with hot-reload
2. **Staging**: Production-like environment for testing
3. **Production**: Live environment

### Deployment Pipeline
1. Code push to main branch
2. GitHub Actions CI/CD triggered
3. Run linting and type-check
4. Run test suite
5. Build optimization analysis
6. Deploy to staging
7. Run E2E tests on staging
8. Manual approval for production
9. Deploy to production with health checks
10. Automatic rollback on critical errors

## Monitoring & Observability

### Metrics Tracked
- Page load times (LCP, FID, CLS)
- API response times
- Error rates
- Cache hit/miss rates
- Database query times
- User actions and flows

### Log Levels
- DEBUG: Detailed debugging information
- INFO: General information
- WARN: Warning messages (slow queries, high latency)
- ERROR: Error messages with stack traces

### Alerting
- Sentry: Critical errors
- Performance: Alerts for slow requests (>1s)
- Security: Suspicious activity, rate limit violations
- Uptime: Endpoint availability checks

## Security Audit Checklist

- ✅ CSRF protection on state-changing operations
- ✅ Rate limiting on authentication endpoints
- ✅ Input validation and sanitization
- ✅ Output encoding to prevent XSS
- ✅ SQL injection prevention via ORM
- ✅ Authentication token management
- ✅ Password hashing with bcrypt
- ✅ Secure session management
- ✅ Security headers configured
- ✅ API key authentication for services
- ✅ Brute-force protection
- ✅ Audit logging for sensitive operations

## Performance Targets

- **First Contentful Paint (FCP)**: < 1.8s
- **Largest Contentful Paint (LCP)**: < 2.5s
- **First Input Delay (FID)**: < 100ms
- **Cumulative Layout Shift (CLS)**: < 0.1
- **Time to Interactive (TTI)**: < 3.8s
- **API Response Time**: < 200ms (p95)
- **Cache Hit Rate**: > 60%
- **Bundle Size**: < 50KB (main)

## Scaling Considerations

- Horizontal scaling via containerization (Docker)
- Database connection pooling with Neon
- Redis cluster for distributed caching
- BullMQ for job queue scaling
- CDN for static assets
- Load balancing across instances
