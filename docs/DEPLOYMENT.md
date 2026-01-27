# 🚀 Deployment Guide - Enterprise CMS

Complete guide for deploying the CMS to production environments.

## 📋 Pre-Deployment Checklist

### Security

- [ ] Change default admin password (`admin@cms.local`)
- [ ] Generate new `NEXTAUTH_SECRET` for production
- [ ] Rotate all API keys and secrets
- [ ] Enable SSL/TLS certificates
- [ ] Configure CORS policies
- [ ] Enable rate limiting
- [ ] Set up CSP (Content Security Policy)
- [ ] Review and update security headers in `next.config.js`

### Database

- [ ] Run all migrations on production database
- [ ] Seed initial roles and permissions
- [ ] Set up automated backups
- [ ] Configure connection pooling
- [ ] Enable query performance monitoring
- [ ] Review RLS (Row Level Security) policies

### Environment

- [ ] Set all required environment variables
- [ ] Use secure secret management (AWS Secrets Manager, Vault, etc.)
- [ ] Configure separate staging environment
- [ ] Set up monitoring and alerting
- [ ] Configure logging aggregation

## 🌐 Deployment Platforms

### Vercel (Recommended)

**Advantages**: Zero-config Next.js deployment, edge functions, automatic HTTPS

#### Steps

1. **Install Vercel CLI**:

```bash
npm install -g vercel
```

2. **Login**:

```bash
vercel login
```

3. **Deploy**:

```bash
vercel --prod
```

4. **Configure Environment Variables**:

In Vercel Dashboard → Project Settings → Environment Variables:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
NEXTAUTH_SECRET=your-production-secret
NEXTAUTH_URL=https://your-domain.com
```

5. **Custom Domain** (Optional):

```bash
vercel domains add your-domain.com
```

#### Vercel Configuration

Create `vercel.json`:

```json
{
  "buildCommand": "npm run build",
  "devCommand": "npm run dev",
  "installCommand": "npm install",
  "framework": "nextjs",
  "regions": ["iad1"],
  "env": {
    "NEXT_PUBLIC_SUPABASE_URL": "@supabase-url",
    "SUPABASE_SERVICE_ROLE_KEY": "@supabase-service-key",
    "NEXTAUTH_SECRET": "@nextauth-secret",
    "NEXTAUTH_URL": "@nextauth-url"
  }
}
```

### AWS (EC2 + RDS)

**Advantages**: Full control, high customization, scalable

#### Architecture

```
Internet → CloudFront (CDN) → ALB → EC2 (Next.js) → RDS (PostgreSQL)
                                      ↓
                                    S3 (Static Assets)
```

#### Steps

1. **Launch RDS PostgreSQL**:

```bash
aws rds create-db-instance \
  --db-instance-identifier cms-prod-db \
  --db-instance-class db.t3.medium \
  --engine postgres \
  --master-username postgres \
  --master-user-password <secure-password> \
  --allocated-storage 20
```

2. **Run Migrations**:

```bash
psql $DATABASE_URL -f database/migrations/001_initial_schema.sql
psql $DATABASE_URL -f database/seeds/001_initial_data.sql
```

3. **Launch EC2 Instance**:

```bash
# Ubuntu 22.04 LTS
# Instance type: t3.medium or higher
# Security Group: Allow 80, 443, 22
```

4. **Install Dependencies**:

```bash
sudo apt update
sudo apt install -y nodejs npm nginx
```

5. **Deploy Application**:

```bash
# Clone repository
git clone <repo-url> /var/www/cms
cd /var/www/cms

# Install dependencies
npm install --production

# Build
npm run build

# Set up PM2
npm install -g pm2
pm2 start npm --name "cms" -- start
pm2 save
pm2 startup
```

6. **Configure Nginx**:

Create `/etc/nginx/sites-available/cms`:

```nginx
server {
    listen 80;
    server_name your-domain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

Enable site:

```bash
sudo ln -s /etc/nginx/sites-available/cms /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

7. **SSL with Let's Encrypt**:

```bash
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d your-domain.com
```

### Docker

**Advantages**: Portable, consistent environments

#### Dockerfile

Create `Dockerfile`:

```dockerfile
# Build stage
FROM node:18-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY . .
RUN npm run build

# Production stage
FROM node:18-alpine AS runner

WORKDIR /app

ENV NODE_ENV production

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

EXPOSE 3000

ENV PORT 3000

CMD ["node", "server.js"]
```

#### Docker Compose

Create `docker-compose.yml`:

```yaml
version: "3.8"

services:
  app:
    build: .
    ports:
      - "3000:3000"
    environment:
      - NEXT_PUBLIC_SUPABASE_URL=${SUPABASE_URL}
      - SUPABASE_SERVICE_ROLE_KEY=${SUPABASE_KEY}
      - NEXTAUTH_SECRET=${NEXTAUTH_SECRET}
      - NEXTAUTH_URL=${NEXTAUTH_URL}
    restart: unless-stopped

  db:
    image: postgres:15-alpine
    ports:
      - "5432:5432"
    environment:
      - POSTGRES_USER=postgres
      - POSTGRES_PASSWORD=${DB_PASSWORD}
      - POSTGRES_DB=cms
    volumes:
      - postgres_data:/var/lib/postgresql/data
      - ./database/migrations:/docker-entrypoint-initdb.d
    restart: unless-stopped

volumes:
  postgres_data:
```

#### Deploy

```bash
docker-compose up -d
```

## 🔧 Production Optimizations

### Next.js Configuration

Update `next.config.js`:

```javascript
module.exports = {
  output: "standalone", // For Docker
  compress: true,
  poweredByHeader: false,

  images: {
    domains: ["your-cdn.com"],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
  },

  async headers() {
    return [
      {
        source: "/:path*",
        headers: securityHeaders,
      },
    ];
  },
};
```

### Database Connection Pooling

Use PgBouncer or Supabase connection pooling:

```typescript
// lib/supabase/admin.ts
export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  db: {
    schema: "public",
  },
  auth: {
    persistSession: false,
    autoRefreshToken: false,
  },
  global: {
    headers: {
      "x-connection-encrypted": "true",
    },
  },
});
```

### Caching Strategy

```typescript
// app/page.tsx
export const revalidate = 3600; // ISR: Revalidate every hour

export async function generateStaticParams() {
  // Pre-render popular pages
  const posts = await getPosts({ limit: 100 });
  return posts.map((post) => ({ slug: post.slug }));
}
```

## 📊 Monitoring & Logging

### Sentry Integration

```bash
npm install @sentry/nextjs
```

Create `sentry.client.config.ts`:

```typescript
import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  environment: process.env.NODE_ENV,
  tracesSampleRate: 1.0,
});
```

### Application Insights

```typescript
// lib/monitoring/insights.ts
import { AppInsights } from "applicationinsights";

export const trackEvent = (name: string, properties?: any) => {
  AppInsights.defaultClient.trackEvent({
    name,
    properties: {
      ...properties,
      timestamp: new Date().toISOString(),
    },
  });
};
```

### Health Check Endpoint

Create `app/api/health/route.ts`:

```typescript
import { supabaseAdmin } from "@/lib/supabase/admin";

export async function GET() {
  try {
    // Check database connection
    const { error } = await supabaseAdmin.from("users").select("id").limit(1);

    if (error) throw error;

    return Response.json({
      status: "healthy",
      timestamp: new Date().toISOString(),
      services: {
        database: "operational",
      },
    });
  } catch (error) {
    return Response.json(
      {
        status: "unhealthy",
        error: String(error),
      },
      { status: 503 },
    );
  }
}
```

## 🔐 Security Hardening

### Rate Limiting

```bash
npm install express-rate-limit
```

```typescript
// middleware.ts
import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

const ratelimit = new Ratelimit({
  redis: Redis.fromEnv(),
  limiter: Ratelimit.slidingWindow(10, "10 s"),
});

export async function middleware(request: NextRequest) {
  const ip = request.ip ?? "127.0.0.1";
  const { success } = await ratelimit.limit(ip);

  if (!success) {
    return new Response("Rate limit exceeded", { status: 429 });
  }

  return NextResponse.next();
}
```

### CSP Headers

```typescript
const securityHeaders = [
  {
    key: "Content-Security-Policy",
    value: `
      default-src 'self';
      script-src 'self' 'unsafe-eval' 'unsafe-inline';
      style-src 'self' 'unsafe-inline';
      img-src 'self' data: https:;
      font-src 'self' data:;
      connect-src 'self' https://your-project.supabase.co;
    `
      .replace(/\s{2,}/g, " ")
      .trim(),
  },
];
```

## 🔄 CI/CD Pipeline

### GitHub Actions

Create `.github/workflows/deploy.yml`:

```yaml
name: Deploy to Production

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v3

      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: "18"

      - name: Install dependencies
        run: npm ci

      - name: Run tests
        run: npm test

      - name: Build
        run: npm run build

      - name: Deploy to Vercel
        uses: amondnet/vercel-action@v25
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.ORG_ID }}
          vercel-project-id: ${{ secrets.PROJECT_ID }}
          vercel-args: "--prod"
```

## 📈 Performance Monitoring

### Web Vitals

```typescript
// app/layout.tsx
import { SpeedInsights } from '@vercel/speed-insights/next';
import { Analytics } from '@vercel/analytics/react';

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        {children}
        <SpeedInsights />
        <Analytics />
      </body>
    </html>
  );
}
```

## 🔙 Backup Strategy

### Database Backups

```bash
# Daily backup cron job
0 2 * * * pg_dump $DATABASE_URL > /backups/cms-$(date +\%Y\%m\%d).sql
```

### Automated Backups (AWS)

```bash
aws rds create-db-snapshot \
  --db-instance-identifier cms-prod-db \
  --db-snapshot-identifier cms-backup-$(date +%Y%m%d)
```

## 🆘 Rollback Procedure

```bash
# Vercel
vercel rollback

# PM2
pm2 list
pm2 reload cms --update-env

# Database
psql $DATABASE_URL < /backups/cms-YYYYMMDD.sql
```

---

**Production deployment requires careful planning and testing. Always test in staging first!**
