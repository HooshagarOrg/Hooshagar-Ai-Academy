'use client'

import { useEffect } from 'react'
import { maybeHardReloadOnStaleBundle } from '@/lib/monitoring/stale-client-bundle'

export function ChunkLoadRecovery(): null {
  useEffect(() => {
    const recover = (error: unknown): void => {
      maybeHardReloadOnStaleBundle(error, window.location, window.sessionStorage)
    }

    const onError = (event: ErrorEvent): void => {
      recover(event.error ?? event.message)
    }
    const onRejection = (event: PromiseRejectionEvent): void => {
      recover(event.reason)
    }

    window.addEventListener('error', onError)
    window.addEventListener('unhandledrejection', onRejection)
    return () => {
      window.removeEventListener('error', onError)
      window.removeEventListener('unhandledrejection', onRejection)
    }
  }, [])

  return null
}
