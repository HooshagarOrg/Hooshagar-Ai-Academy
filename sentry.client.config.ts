import * as Sentry from '@sentry/nextjs'

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN || process.env.SENTRY_DSN,

  tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.2 : 1.0,

  replaysSessionSampleRate: 0.1,
  replaysOnErrorSampleRate: 1.0,

  integrations: [
    Sentry.replayIntegration({
      maskAllText: true,
      blockAllMedia: true,
      maskAllInputs: true,
    }),
  ],

  environment: process.env.NODE_ENV || 'development',

  ignoreErrors: [
    'ResizeObserver loop limit exceeded',
    'Non-Error promise rejection captured',
    'Multiple Sentry Session Replay instances are not supported',
    "Cannot read properties of null (reading 'get')",
    'Invalid login credentials',
    'Invalid login',
    'AuthApiError',
  ],

  release: process.env.VERCEL_GIT_COMMIT_SHA || 'development',
})
