# Performance Optimization Guide

این مستند استراتژی‌های بهینه‌سازی عملکرد پروژه هوشاگر را توضیح می‌دهد.

---

## Table of Contents
- [Database Optimization](#database-optimization)
- [Caching Strategy](#caching-strategy)
- [Image Optimization](#image-optimization)
- [Code Splitting](#code-splitting)
- [Performance Monitoring](#performance-monitoring)
- [Load Testing](#load-testing)
- [Best Practices](#best-practices)

---

## Database Optimization

### Indexes
تمام کوئری‌های پرتکرار دارای Index هستند:

```sql
-- Students by school and grade
CREATE INDEX idx_students_school_grade ON students(school_id, grade);

-- Attendance by student and date
CREATE INDEX idx_attendance_student_date ON attendance(student_id, date DESC);

-- AI logs by user and feature
CREATE INDEX idx_ai_logs_user_feature_date 
  ON ai_request_logs(user_id, feature_name, created_at DESC);
```

### Materialized Views
برای Dashboard ها از Materialized Views استفاده می‌شود:

```sql
-- آمار روزانه کلاس
CREATE MATERIALIZED VIEW daily_class_attendance_stats AS ...

-- عملکرد دانش‌آموزان
CREATE MATERIALIZED VIEW student_performance_summary AS ...

-- آمار استفاده از AI
CREATE MATERIALIZED VIEW ai_usage_stats AS ...
```

**Refresh Strategy:**
- Automatic: هر 1 ساعت (Cron Job)
- Manual: `SELECT refresh_all_materialized_views();`

### Query Optimization
```typescript
// ❌ BAD: Select all
const { data } = await supabase
  .from('students')
  .select('*');

// ✅ GOOD: Select specific columns
const { data } = await supabase
  .from('students')
  .select('id, first_name, last_name, grade')
  .limit(20);
```

---

## Caching Strategy

### Redis Cache (Vercel KV)

```typescript
import { CacheClient, CacheKeys, CacheTTL } from '@/lib/cache/redis-client';

// Cache student data
await CacheClient.set(
  CacheKeys.student(studentId),
  studentData,
  { ttl: CacheTTL.LONG } // 1 hour
);

// Get from cache
const student = await CacheClient.get(CacheKeys.student(studentId));
```

### Next.js Cache

```typescript
import { createCachedFunction, RevalidateTime } from '@/lib/cache/next-cache';

// Server-side caching
const getCachedStudent = createCachedFunction(
  fetchStudent,
  ['student'],
  { revalidate: RevalidateTime.NORMAL } // 1 minute
);
```

### Cache Invalidation

```typescript
// Invalidate specific key
await CacheClient.delete(CacheKeys.student(studentId));

// Invalidate by pattern
await CacheClient.deletePattern('student:*');

// Invalidate by tag
await CacheClient.invalidateByTag('students');
```

---

## Image Optimization

### Using Next/Image

```tsx
import Image from 'next/image';

// ✅ GOOD: Optimized image
<Image
  src="/profile.jpg"
  alt="Profile"
  width={200}
  height={200}
  quality={75}
  loading="lazy"
  placeholder="blur"
/>

// ❌ BAD: Regular img tag
<img src="/profile.jpg" alt="Profile" />
```

### Responsive Images

```tsx
<Image
  src="/banner.jpg"
  alt="Banner"
  fill
  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
  priority={false}
/>
```

### Remote Images
در `next.config.js` تنظیم شده:

```javascript
images: {
  remotePatterns: [
    {
      protocol: 'https',
      hostname: '**.arvanstorage.ir',
    },
  ],
}
```

---

## Code Splitting

### Dynamic Imports

```tsx
import dynamic from 'next/dynamic';

// Lazy load heavy component
const AIAnalyzer = dynamic(
  () => import('@/components/features/ai/analyzer'),
  {
    loading: () => <Skeleton />,
    ssr: false,
  }
);

// Lazy load with suspense
const ChartComponent = dynamic(
  () => import('recharts').then(mod => mod.LineChart),
  { ssr: false }
);
```

### Route-based Splitting
Next.js automatically splits code by route.

```
app/
  dashboard/
    page.tsx         → dashboard bundle
  students/
    page.tsx         → students bundle
  attendance/
    page.tsx         → attendance bundle
```

---

## Performance Monitoring

### Web Vitals

```tsx
import { PerformanceMonitor } from '@/components/providers/performance-monitor';

// در layout.tsx
export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        <PerformanceMonitor />
        {children}
      </body>
    </html>
  );
}
```

### Metrics Tracked
- **LCP** (Largest Contentful Paint): < 2.5s
- **FID** (First Input Delay): < 100ms
- **CLS** (Cumulative Layout Shift): < 0.1
- **TTFB** (Time to First Byte): < 600ms
- **FCP** (First Contentful Paint): < 1.8s

### Monitoring Dashboard
```
Vercel Analytics → Performance
Sentry → Performance Monitoring
```

---

## Load Testing

### با k6

```bash
# نصب k6
# macOS
brew install k6

# Windows
choco install k6

# Linux
sudo apt install k6
```

### اجرای تست

```bash
# Local
k6 run scripts/load-test.js

# Production
BASE_URL=https://hooshagar.com k6 run scripts/load-test.js

# با گزارش
k6 run --out json=test-results.json scripts/load-test.js
```

### تفسیر نتایج

```
✅ GOOD: p(95) < 500ms, error rate < 5%
⚠️  WARNING: p(95) < 1s, error rate < 10%
❌ BAD: p(95) > 1s, error rate > 10%
```

---

## Best Practices

### 1. Database Queries
- ✅ Use indexes for frequent queries
- ✅ Select only needed columns
- ✅ Use materialized views for complex aggregations
- ✅ Implement pagination (limit/offset)
- ❌ Don't use `SELECT *`
- ❌ Don't fetch all records without limit

### 2. API Routes
- ✅ Implement caching
- ✅ Use Edge Runtime where possible
- ✅ Implement rate limiting
- ✅ Return minimal data
- ❌ Don't fetch unnecessary data
- ❌ Don't block on slow operations

### 3. Frontend
- ✅ Use dynamic imports for heavy components
- ✅ Implement virtual scrolling for long lists
- ✅ Use `loading="lazy"` for images
- ✅ Minimize bundle size
- ❌ Don't import entire libraries
- ❌ Don't render large lists without virtualization

### 4. Caching
- ✅ Cache expensive operations
- ✅ Implement cache invalidation
- ✅ Use appropriate TTLs
- ❌ Don't cache user-specific data globally
- ❌ Don't forget to invalidate on updates

---

## Performance Targets

```
┌──────────────────────┬──────────┬────────────┐
│ Metric               │ Target   │ Excellent  │
├──────────────────────┼──────────┼────────────┤
│ API Response (no AI) │ < 500ms  │ < 200ms    │
│ AI Response          │ < 15s    │ < 10s      │
│ Dashboard Load       │ < 2s     │ < 1s       │
│ First Paint          │ < 1.8s   │ < 1s       │
│ Time to Interactive  │ < 3.8s   │ < 2s       │
│ Cache Hit Rate       │ > 50%    │ > 80%      │
└──────────────────────┴──────────┴────────────┘
```

---

## Monitoring Checklist

```
✅ Vercel Analytics enabled
✅ Sentry Performance Monitoring configured
✅ Web Vitals tracking active
✅ Database query logging enabled
✅ Cache hit rate monitoring
✅ API response time tracking
✅ Error rate monitoring
✅ Load testing scheduled weekly
```

---

## Troubleshooting

### Slow Database Queries
```sql
-- Check slow queries
SELECT * FROM pg_stat_statements 
ORDER BY mean_exec_time DESC 
LIMIT 10;

-- Check missing indexes
SELECT * FROM pg_stat_user_tables 
WHERE seq_scan > 0 
ORDER BY seq_scan DESC;
```

### High Cache Miss Rate
- Check cache TTL settings
- Verify cache invalidation logic
- Monitor cache storage limits
- Review cache key patterns

### Slow Page Load
- Check bundle size: `npm run build` → `.next/analyze`
- Review dynamic imports
- Check image optimization
- Verify CDN configuration

---

## Additional Resources

- [Next.js Performance](https://nextjs.org/docs/app/building-your-application/optimizing)
- [Web Vitals](https://web.dev/vitals/)
- [k6 Documentation](https://k6.io/docs/)
- [Vercel Analytics](https://vercel.com/analytics)
- [Sentry Performance](https://docs.sentry.io/product/performance/)


























