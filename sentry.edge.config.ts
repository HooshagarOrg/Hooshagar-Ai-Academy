import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN || process.env.SENTRY_DSN,
  
  tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
  
  environment: process.env.NODE_ENV || 'development',

  ignoreErrors: [
    'Invalid login credentials',
    'Invalid login',
    'AuthApiError',
  ],
  
  release: process.env.VERCEL_GIT_COMMIT_SHA || 'development',
});




























