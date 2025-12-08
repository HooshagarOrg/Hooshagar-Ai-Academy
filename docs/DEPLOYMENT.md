# Deployment Guide

## Prerequisites

### Required Services
- ✅ Vercel Account
- ✅ Supabase Project
- ✅ GitHub Repository
- ✅ Domain (optional)

### Required API Keys
See `.env.example` for complete list

---

## Deployment Steps

### 1. Prepare Repository
```bash
# Ensure all changes are committed
git status

# Push to GitHub
git push origin master
```

### 2. Connect Vercel

1. Go to [vercel.com](https://vercel.com)
2. Click "New Project"
3. Import Git Repository
4. Select `hooshagar` repository

### 3. Configure Environment Variables

In Vercel Dashboard → Settings → Environment Variables:

**Required:**
```env
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
OPENROUTER_API_KEY=sk-or-v1-...
KAVENEGAR_API_KEY=...
KAVENEGAR_SENDER=...
ARVAN_ACCESS_KEY=...
ARVAN_SECRET_KEY=...
ARVAN_ENDPOINT=https://s3.ir-thr-at1.arvanstorage.ir
ARVAN_BUCKET_NAME=hooshagar
NEXT_PUBLIC_SENTRY_DSN=https://...
RECAPTCHA_SECRET_KEY=...
NEXT_PUBLIC_RECAPTCHA_SITE_KEY=...
```

**Optional:**
```env
GEMINI_PROXY_URL=https://...workers.dev
GEMINI_API_KEY_1=AIzaSy...
GEMINI_API_KEY_2=AIzaSy...
...
GEMINI_API_KEY_10=AIzaSy...
```

### 4. Deploy

Click "Deploy" button

Vercel will:
1. Install dependencies
2. Run build
3. Deploy to production

### 5. Post-Deployment

#### A. Supabase Configuration

1. **Enable Point-in-Time Recovery:**
   - Dashboard → Settings → Database
   - Enable PITR

2. **Setup Cron Jobs:**
   - Dashboard → Database → Cron Jobs
   - Add daily backup job

3. **Apply Migrations:**
```bash
npx supabase db push
```

#### B. Sentry Configuration

1. Go to [sentry.io](https://sentry.io)
2. Create project: `hooshagar-platform`
3. Copy DSN to `NEXT_PUBLIC_SENTRY_DSN`

#### C. Domain Setup (Optional)

1. Vercel Dashboard → Domains
2. Add custom domain
3. Configure DNS records

#### D. SSL Certificate

Automatic via Vercel (Let's Encrypt)

---

## Monitoring

### Health Check
```bash
curl https://hooshagar.com/api/health
```

Expected response:
```json
{
  "status": "healthy",
  "services": {
    "database": "up",
    "api": "up"
  }
}
```

### Sentry Dashboard

Monitor errors at: https://sentry.io/organizations/hooshagar

### Vercel Analytics

View at: https://vercel.com/dashboard/analytics

---

## Rollback

If deployment fails:

1. Vercel Dashboard → Deployments
2. Find previous working deployment
3. Click "Promote to Production"

---

## Backup & Recovery

### Manual Backup
```bash
# Export from Supabase
npx supabase db dump -f backup.sql
```

### Restore
```bash
# Import to Supabase
psql -h db.xxx.supabase.co -U postgres -f backup.sql
```

---

## Troubleshooting

### Build Fails
```bash
# Check logs in Vercel
# Common issues:
# 1. Missing environment variables
# 2. TypeScript errors
# 3. ESLint errors
```

### Database Connection Issues
```bash
# Verify Supabase URL and Keys
# Check RLS policies
# Verify migrations applied
```

### API Errors
```bash
# Check Sentry for detailed errors
# Verify API keys
# Check rate limits
```

---

## Support

- GitHub Issues: https://github.com/pedpeddy60/HooshaGar-Academy-Curser-Test/issues
- Sentry: https://sentry.io
- Vercel Support: https://vercel.com/support
