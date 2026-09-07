import * as Sentry from '@sentry/nextjs'
import { isPublicMarketingPath } from '@/lib/monitoring/public-path'

/** Replay فقط برای داشبورد — rrweb را روی لندینگ/ورود بار نکن. */
export function addClientReplay(): void {
  if (isPublicMarketingPath()) return
  const client = Sentry.getClient()
  if (!client || client.getIntegrationByName('Replay')) return

  client.addIntegration(
    Sentry.replayIntegration({
      maskAllText: true,
      blockAllMedia: true,
      maskAllInputs: true,
    }),
  )
  const options = client.getOptions() as {
    replaysSessionSampleRate?: number
    replaysOnErrorSampleRate?: number
  }
  options.replaysSessionSampleRate = 0.1
  options.replaysOnErrorSampleRate = 1.0
}
