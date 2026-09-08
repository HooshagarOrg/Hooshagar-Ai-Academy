'use client'

import { useEffect } from 'react'
import { maybeHardReloadOnStaleBundle } from '@/lib/monitoring/stale-client-bundle'

interface GlobalErrorProps {
  error: Error & { digest?: string }
  reset: () => void
}

export default function GlobalError({ error, reset }: GlobalErrorProps): JSX.Element {
  useEffect(() => {
    if (maybeHardReloadOnStaleBundle(error, window.location, window.sessionStorage)) {
      return
    }
    void import(
      /* webpackPrefetch: false, webpackPreload: false */
      '@sentry/nextjs'
    )
      .then((Sentry) => {
        Sentry.captureException(error)
      })
      .catch(() => undefined)
  }, [error])

  return (
    <html lang="fa" dir="rtl">
      <body>
        <div
          className="flex min-h-screen items-center justify-center p-4"
          style={{
            background: 'linear-gradient(to bottom right, #0f172a, #1e3a5f, #0f172a)',
            fontFamily: 'Vazir, Tahoma, sans-serif',
          }}
        >
          <div
            className="w-full max-w-md rounded-3xl p-8 text-center"
            style={{
              background: 'rgba(255, 255, 255, 0.1)',
              backdropFilter: 'blur(10px)',
              border: '1px solid rgba(255, 255, 255, 0.2)',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
            }}
          >
            <h1
              style={{
                fontSize: '1.75rem',
                fontWeight: 'bold',
                color: 'white',
                marginBottom: '0.75rem',
              }}
            >
              خطای سیستمی
            </h1>
            <p
              style={{
                color: 'rgba(255, 255, 255, 0.6)',
                marginBottom: '2rem',
                lineHeight: '1.8',
              }}
            >
              یک خطای غیرمنتظره در سیستم رخ داده است.
              <br />
              لطفاً صفحه را بارگذاری مجدد کنید.
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <button
                type="button"
                onClick={reset}
                style={{
                  padding: '1rem 1.5rem',
                  background: 'linear-gradient(to right, #3b82f6, #06b6d4)',
                  color: 'white',
                  fontWeight: 'bold',
                  borderRadius: '0.75rem',
                  border: 'none',
                  cursor: 'pointer',
                  fontSize: '1rem',
                }}
              >
                تلاش دوباره
              </button>
              <a
                href="/"
                style={{
                  padding: '1rem 1.5rem',
                  background: 'rgba(255, 255, 255, 0.1)',
                  color: 'white',
                  fontWeight: 'bold',
                  borderRadius: '0.75rem',
                  border: '1px solid rgba(255, 255, 255, 0.2)',
                  textDecoration: 'none',
                  fontSize: '1rem',
                }}
              >
                بازگشت به خانه
              </a>
            </div>
            {error.digest ? (
              <p
                style={{
                  marginTop: '1.5rem',
                  padding: '0.75rem',
                  background: 'rgba(255, 255, 255, 0.05)',
                  borderRadius: '0.5rem',
                  color: 'rgba(255, 255, 255, 0.4)',
                  fontSize: '0.75rem',
                  fontFamily: 'monospace',
                }}
              >
                کد خطا: {error.digest}
              </p>
            ) : null}
            <p
              style={{
                marginTop: '2rem',
                color: 'rgba(255, 255, 255, 0.3)',
                fontSize: '0.75rem',
              }}
            >
              سیستم هوشمند مدیریت مدارس - هوشاگر
            </p>
          </div>
        </div>
      </body>
    </html>
  )
}
