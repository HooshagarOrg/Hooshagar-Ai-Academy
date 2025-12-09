import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  
  tracesSampleRate: 1.0,
  
  environment: process.env.NODE_ENV || 'development',
  
  release: process.env.VERCEL_GIT_COMMIT_SHA || 'development',
});



