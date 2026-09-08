'use client'

import { ChunkLoadRecovery } from '@/components/chunk-load-recovery'
import { DeferredChrome } from '@/components/deferred-chrome'
import { SentryClientInit } from '@/components/sentry-client-init'
import { ServiceWorkerRegister } from '@/components/service-worker-register'

/** کروم کلاینت — فقط مسیرهای احراز هویت‌شده و ورود، نه لندینگ. */
export function AppChrome(): JSX.Element {
  return (
    <>
      <SentryClientInit />
      <ChunkLoadRecovery />
      <DeferredChrome />
      <ServiceWorkerRegister />
    </>
  )
}
