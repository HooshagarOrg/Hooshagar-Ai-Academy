import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  
  // Performance Monitoring
  tracesSampleRate: 1.0,
  
  // Replay (فقط برای خطاها - حریم خصوصی)
  replaysSessionSampleRate: 0.1,
  replaysOnErrorSampleRate: 1.0,
  
  integrations: [
    Sentry.replayIntegration({
      maskAllText: true, // محافظت حریم خصوصی
      blockAllMedia: true,
      maskAllInputs: true,
    }),
  ],
  
  // محیط
  environment: process.env.NODE_ENV || 'development',
  
  // Ignore کردن خطاهای خاص
  ignoreErrors: [
    'ResizeObserver loop limit exceeded',
    'Non-Error promise rejection captured',
  ],
  
  // Release tracking
  release: process.env.VERCEL_GIT_COMMIT_SHA || 'development',
});












