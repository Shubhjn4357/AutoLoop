# AutoLoop Deployment Guide

## Prerequisites

### System Requirements
- Node.js 18+ (LTS recommended)
- PostgreSQL 14+
- pnpm 8+ (or npm/yarn)
- Redis (optional, for caching and queues)

### Required Accounts
- Google Cloud Platform (for OAuth, Gmail API)
- Facebook Developer Account (for social automation)
- Database hosting (Neon, Supabase, or self-hosted PostgreSQL)

## Environment Setup

### 1. Clone Repository
```bash
git clone <repository-url>
cd autoloop
```

### 2. Install Dependencies
```bash
pnpm install
```

### 3. Configure Environment Variables

Create `.env.local`:

```env
# Database
DATABASE_URL=postgresql://user:password@host:5432/autoloop

# NextAuth
NEXTAUTH_SECRET=<generate-with: openssl rand -base64 32>
NEXTAUTH_URL=http://localhost:3000

# Google OAuth (for Gmail and Google login)
GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-client-secret
GOOGLE_REDIRECT_URI=http://localhost:3000/api/auth/callback/google

# Facebook (for social automation)
FACEBOOK_APP_ID=your-facebook-app-id
FACEBOOK_APP_SECRET=your-facebook-app-secret
FACEBOOK_WEBHOOK_VERIFY_TOKEN=your-custom-verify-token

# LinkedIn (optional)
LINKEDIN_CLIENT_ID=your-linkedin-client-id
LINKEDIN_CLIENT_SECRET=your-linkedin-client-secret

# Admin
ADMIN_EMAIL=admin@yourdomain.com

# Workers
START_WORKERS=false  # Set to true in production

# Optional: Redis
REDIS_URL=redis://localhost:6379

# Optional: Gemini API (for AI features)
GEMINI_API_KEY=your-gemini-api-key
```

### 4. Database Setup

```bash
# Push schema to database
pnpm run db:push

# Or run migrations
pnpm run db:migrate
```

### 5. Build Application

```bash
pnpm run build
```

## Development

```bash
# Start development server
pnpm run dev

# Open http://localhost:3000
```

## Production Deployment

### Option 1: Vercel (Recommended)

1. **Install Vercel CLI**:
```bash
npm i -g vercel
```

2. **Deploy**:
```bash
vercel
```

3. **Configure Environment Variables**:
- Go to Vercel Dashboard → Settings → Environment Variables
- Add all variables from `.env.local`

4. **Enable Workers**:
- Set `START_WORKERS=true` in production environment

### Option 2: Docker

1. **Create Dockerfile** (if not exists):
```dockerfile
FROM node:18-alpine

WORKDIR /app

COPY package.json pnpm-lock.yaml ./
RUN npm install -g pnpm && pnpm install

COPY . .
RUN pnpm run build

EXPOSE 3000

CMD ["pnpm", "start"]
```

2. **Build and Run**:
```bash
docker build -t autoloop .
docker run -p 3000:3000 --env-file .env.local autoloop
```

### Option 3: VPS/Server

1. **Setup Server** (Ubuntu example):
```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Node.js
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install pnpm
npm install -g pnpm

# Install PM2 for process management
npm install -g pm2
```

2. **Clone and Build**:
```bash
git clone <repository-url>
cd autoloop
pnpm install
pnpm run build
```

3. **Start with PM2**:
```bash
pm2 start npm --name "autoloop" -- start
pm2 save
pm2 startup
```

4. **Setup Nginx Reverse Proxy**:
```nginx
server {
    listen 80;
    server_name yourdomain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

5. **Setup SSL with Certbot**:
```bash
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d yourdomain.com
```

## Post-Deployment Configuration

### 1. Facebook Webhook Setup

1. Go to Facebook App Dashboard → Webhooks
2. Add webhook URL: `https://yourdomain.com/api/social/webhooks/facebook`
3. Verify token: Use value from `FACEBOOK_WEBHOOK_VERIFY_TOKEN`
4. Subscribe to: `comments`, `feed`, `mentions`, `messages`

### 2. Google OAuth Setup

1. Go to Google Cloud Console → APIs & Services → Credentials
2. Create OAuth 2.0 Client ID
3. Add authorized redirect URI: `https://yourdomain.com/api/auth/callback/google`
4. Enable Gmail API and Google+ API

### 3. Test Social Automation

```bash
# Trigger manual test
curl -X POST https://yourdomain.com/api/social/automations/trigger

# Check worker status
curl https://yourdomain.com/api/social/automations/trigger
```

## Monitoring

### Health Checks

```bash
# Application health
curl https://yourdomain.com/api/health

# Worker status
curl https://yourdomain.com/api/social/automations/trigger
```

### Logs

**Vercel**:
- View logs in Vercel Dashboard

**PM2**:
```bash
pm2 logs autoloop
pm2 monit
```

**Docker**:
```bash
docker logs <container-id>
```

## Troubleshooting

### Build Failures

```bash
# Clear cache
rm -rf .next node_modules
pnpm install
pnpm run build
```

### Database Connection Issues

```bash
# Test database connection
psql $DATABASE_URL

# Check Drizzle schema
pnpm run db:studio
```

### Worker Not Starting

1. Verify `START_WORKERS=true` in production
2. Check logs for errors
3. Test manually: `POST /api/social/automations/trigger`

### Webhook Issues

1. Verify webhook URL is HTTPS
2. Check Facebook App is in Production mode
3. Test webhook verification endpoint

## Performance Optimization

### 1. Database

- Enable connection pooling
- Add indexes for frequent queries
- Use Neon/Supabase for managed PostgreSQL

### 2. Caching

- Enable Redis for session storage
- Cache API responses
- Use CDN for static assets

### 3. Monitoring

- Set up error tracking (Sentry)
- Enable application monitoring
- Configure alerts for downtime

## Backup & Recovery

### Database Backups

```bash
# Daily backup (cron job)
pg_dump $DATABASE_URL > backup_$(date +%Y%m%d).sql

# Restore
psql $DATABASE_URL < backup.sql
```

### Application Backups

- Version control (Git)
- Environment variables (secure storage)
- Database backups (automated)

## Security Checklist

- [ ] HTTPS enabled
- [ ] Environment variables secured
- [ ] Database connection encrypted
- [ ] CSRF protection enabled
- [ ] Rate limiting configured
- [ ] File upload validation
- [ ] API authentication required
- [ ] Webhook signature verification
- [ ] Regular security updates

## Scaling

### Horizontal Scaling

- Use load balancer (Nginx, HAProxy)
- Deploy multiple instances
- Share session storage (Redis)
- Use managed database

### Vertical Scaling

- Increase server resources
- Optimize database queries
- Enable caching layers
- Use CDN for static files

## Support

For issues and questions:
- Check logs first
- Review error messages
- Test locally with same environment
- Verify all environment variables are set
