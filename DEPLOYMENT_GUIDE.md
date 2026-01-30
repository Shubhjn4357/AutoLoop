# Deployment Guide

## Prerequisites

- Node.js 20+
- Docker & Docker Compose (for containerization)
- PostgreSQL 14+
- Redis 7+
- GitHub account with Actions enabled
- Sentry account (optional but recommended)

## Local Development Setup

```bash
# 1. Clone repository
git clone <repository-url>
cd autoloop

# 2. Install dependencies
pnpm install

# 3. Setup environment
cp .env.example .env.local

# 4. Update .env.local with your values
nano .env.local

# 5. Setup database
pnpm run db:push

# 6. Run development server
pnpm run dev:all

# 7. Open http://localhost:3000
```

## Docker Deployment

### Build Docker Image

```bash
# Build image
docker build -t autoloop:latest .

# Run with docker-compose
docker-compose up -d
```

### Docker Compose Configuration

```yaml
version: '3.8'

services:
  app:
    build: .
    ports:
      - "3000:3000"
    environment:
      - DATABASE_URL=postgresql://user:password@db:5432/autoloop
      - REDIS_URL=redis://redis:6379
    depends_on:
      - db
      - redis
    restart: always

  db:
    image: postgres:15-alpine
    environment:
      - POSTGRES_USER=user
      - POSTGRES_PASSWORD=password
      - POSTGRES_DB=autoloop
    volumes:
      - postgres_data:/var/lib/postgresql/data
    restart: always

  redis:
    image: redis:7-alpine
    volumes:
      - redis_data:/data
    restart: always

volumes:
  postgres_data:
  redis_data:
```

## Production Deployment

### Environment Variables

Required environment variables for production:

```
NODE_ENV=production
NEXTAUTH_SECRET=<generate-with-openssl-rand-hex-32>
NEXTAUTH_URL=https://yourdomain.com
DATABASE_URL=postgresql://user:pass@host:5432/db
REDIS_URL=redis://host:6379
NEXT_PUBLIC_SENTRY_DSN=https://key@sentry.io/project
SENTRY_AUTH_TOKEN=your-auth-token
```

### Database Migration

```bash
# Generate migration files
pnpm run db:generate

# Apply migrations
pnpm run db:push

# Verify migration
pnpm run db:studio
```

### Build for Production

```bash
# Build Next.js application
pnpm run build

# Analyze bundle size
pnpm run build:analyze

# Start production server
pnpm run start
```

## Deployment Platforms

### Vercel (Recommended for Next.js)

1. **Connect Repository**
   - Go to vercel.com
   - Import your repository
   - Select Next.js framework

2. **Environment Variables**
   - Add all required env vars in dashboard
   - Enable "Encrypt sensitive variables"

3. **Database**
   - Use Neon for PostgreSQL (vercel partner)
   - Use Upstash for Redis (vercel partner)

4. **Deploy**
   - Automatic deployment on push to main
   - Preview deployments for PRs

```bash
# Deploy to Vercel
npm i -g vercel
vercel --prod
```

### AWS EC2

```bash
# 1. Launch EC2 instance (Ubuntu 22.04)
# Choose t3.medium or larger

# 2. SSH into instance
ssh -i key.pem ubuntu@your-instance-ip

# 3. Install dependencies
sudo apt update
sudo apt install -y nodejs npm postgresql redis-server

# 4. Clone repository
git clone <repo> ~/autoloop
cd ~/autoloop

# 5. Install app dependencies
npm install --legacy-peer-deps
npm run build

# 6. Setup PM2 for process management
npm install -g pm2
pm2 start "npm run start" --name autoloop
pm2 startup
pm2 save

# 7. Setup reverse proxy (Nginx)
sudo apt install -y nginx
# Configure nginx with SSL via Let's Encrypt
```

### Railway/Render

1. Connect your GitHub repository
2. Select Node.js environment
3. Set environment variables
4. Add PostgreSQL and Redis services
5. Deploy automatically on push

### Docker Swarm / Kubernetes

For large-scale deployments:

```bash
# Initialize Swarm
docker swarm init

# Deploy stack
docker stack deploy -c docker-compose.prod.yml autoloop

# For Kubernetes
kubectl apply -f k8s/

# Check status
kubectl get pods
kubectl get services
```

## SSL/TLS Certificate

### Let's Encrypt (Free)

```bash
# Install Certbot
sudo apt install certbot python3-certbot-nginx

# Get certificate
sudo certbot certonly --nginx -d yourdomain.com

# Auto-renewal
sudo systemctl enable certbot.timer
sudo systemctl start certbot.timer
```

## GitHub Actions CI/CD

### Workflow Configuration

```yaml
name: Build and Deploy

on:
  push:
    branches: [main, staging]
  pull_request:
    branches: [main, staging]

jobs:
  build:
    runs-on: ubuntu-latest
    
    services:
      postgres:
        image: postgres:15
        env:
          POSTGRES_PASSWORD: postgres
      redis:
        image: redis:7
    
    steps:
      - uses: actions/checkout@v3
      
      - uses: pnpm/action-setup@v2
      - uses: actions/setup-node@v3
        with:
          node-version: 20
          cache: 'pnpm'
      
      - name: Install dependencies
        run: pnpm install
      
      - name: Run linter
        run: pnpm run lint
      
      - name: Type check
        run: pnpm run type-check
      
      - name: Run tests
        run: pnpm run test
      
      - name: Build
        run: pnpm run build
      
      - name: E2E Tests
        run: pnpm exec playwright install && pnpm run test:e2e
      
      - name: Deploy to staging
        if: github.ref == 'refs/heads/staging'
        run: |
          # Deploy script
          npm run deploy:staging
      
      - name: Deploy to production
        if: github.ref == 'refs/heads/main'
        run: |
          # Deploy script
          npm run deploy:prod
```

## Monitoring & Health Checks

### Health Check Endpoint

```
GET /api/health
```

Response:
```json
{
  "status": "healthy",
  "timestamp": "2024-01-30T12:00:00Z",
  "uptime": 3600,
  "services": {
    "database": "connected",
    "redis": "connected",
    "api": "responding"
  }
}
```

### Metrics Monitoring

- Sentry for error tracking
- CloudWatch/DataDog for metrics
- Vercel Analytics for performance
- Custom dashboards for business metrics

## Rollback Procedure

```bash
# Check recent deployments
git log --oneline -5

# Rollback to previous version
git revert <commit-hash>
git push

# Or immediate rollback
vercel rollback

# Monitor after rollback
vercel logs
```

## Performance Optimization

### Caching Strategy

- Cloudflare/CDN for static assets
- Redis for database query results
- Next.js Image Optimization
- Minification and compression

### Database Optimization

- Connection pooling
- Query optimization
- Vacuum and analyze regularly
- Monitor slow queries

## Security Checklist

- [ ] Environment variables are encrypted
- [ ] Database credentials rotated
- [ ] SSL/TLS certificates valid
- [ ] Security headers configured
- [ ] Rate limiting enabled
- [ ] WAF (Web Application Firewall) enabled
- [ ] DDoS protection enabled
- [ ] Regular backups configured
- [ ] Audit logs enabled
- [ ] Penetration testing completed

## Backup & Recovery

### Database Backup

```bash
# Create backup
pg_dump DATABASE_URL > backup.sql

# Restore from backup
psql DATABASE_URL < backup.sql

# Automated backups
# Use managed database service (Neon, AWS RDS) for automatic backups
```

### Disaster Recovery Plan

1. **RTO (Recovery Time Objective)**: < 1 hour
2. **RPO (Recovery Point Objective)**: < 15 minutes
3. **Backup Strategy**: Daily full + hourly incremental
4. **Testing**: Monthly disaster recovery drills

## Troubleshooting

### Application won't start

```bash
# Check logs
pm2 logs autoloop

# Check environment variables
env | grep NEXT

# Rebuild and restart
npm run build
pm2 restart autoloop
```

### Database connection issues

```bash
# Test connection
psql $DATABASE_URL

# Check connection pooling
# Verify pool size in environment

# Restart database service
sudo systemctl restart postgresql
```

### Redis cache issues

```bash
# Check Redis connection
redis-cli ping

# Clear cache
redis-cli FLUSHDB

# Check memory usage
redis-cli INFO memory
```

## Support & Resources

- Documentation: `/docs`
- API Reference: `/API_DOCUMENTATION.md`
- Architecture: `/ARCHITECTURE.md`
- Issues: GitHub Issues
- Discussions: GitHub Discussions
