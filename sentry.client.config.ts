import * as Sentry from '@sentry/nextjs'

function replayIntegrations(): ReturnType<typeof Sentry.replayIntegration>[] {
  try {
    if (Sentry.getClient()?.getIntegrationByName('Replay')) {
      return []
    }
    return [
      Sentry.replayIntegration({
        maskAllText: true,
        blockAllMedia: true,
        maskAllInputs: true,
      }),
    ]
  } catch {
    return []
  }
}

try {
  if (!Sentry.getClient()) {
    Sentry.init({
      dsn: process.env.NEXT_PUBLIC_SENTRY_DSN || process.env.SENTRY_DSN,

      tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.2 : 1.0,

      replaysSessionSampleRate: 0.1,
      replaysOnErrorSampleRate: 1.0,

      integrations: replayIntegrations(),

      environment: process.env.NODE_ENV || 'development',

      ignoreErrors: [
        'ResizeObserver loop limit exceeded',
        'Non-Error promise rejection captured',
        'Invalid login credentials',
        'Invalid login',
        'AuthApiError',
      ],

      release: process.env.NEXT_PUBLIC_VERCEL_GIT_COMMIT_SHA
        || process.env.VERCEL_GIT_COMMIT_SHA
        || 'development',
    })
  }
} catch {
  // Sentry must never block the app
}
