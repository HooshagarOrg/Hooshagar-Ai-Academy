'use client'

import { useEffect, useState } from 'react'
import { maybeHardReloadOnStaleBundle } from '@/lib/monitoring/stale-client-bundle'

interface ErrorProps {
  error: Error & { digest?: string }
  reset: () => void
}

function isNextNavigationError(error: Error & { digest?: string }): boolean {
  const digest = error.digest ?? ''
  return digest.startsWith('NEXT_REDIRECT') || digest.startsWith('NEXT_NOT_FOUND')
}

export default function Error({ error, reset }: ErrorProps): JSX.Element {
  const [showDetails, setShowDetails] = useState(false)
  const isDevelopment = process.env.NODE_ENV === 'development'

  if (isNextNavigationError(error)) {
    throw error
  }

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
    <div
      className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-900 via-blue-900/30 to-slate-900 p-4"
      dir="rtl"
    >
      <div className="w-full max-w-lg">
        <div className="rounded-3xl border border-white/20 bg-white/10 p-8 shadow-2xl backdrop-blur-lg">
          <div className="mb-8 text-center">
            <h1 className="mb-3 text-2xl font-bold text-white md:text-3xl">
              اوه! مشکلی پیش آمد
            </h1>
            <p className="leading-relaxed text-white/60">
              متأسفانه در پردازش درخواست شما خطایی رخ داده است.
              <br />
              نگران نباشید، تیم فنی ما در حال بررسی است.
            </p>
          </div>

          <div className="mb-4 flex flex-col gap-3 sm:flex-row">
            <button
              type="button"
              onClick={reset}
              className="flex-1 rounded-xl bg-gradient-to-r from-blue-500 to-cyan-500 px-6 py-4 font-bold text-white shadow-lg shadow-blue-500/30 transition-all hover:from-blue-600 hover:to-cyan-600"
            >
              تلاش دوباره
            </button>
            <a
              href="/"
              className="flex-1 rounded-xl border border-white/20 bg-white/10 px-6 py-4 text-center font-bold text-white transition-all hover:bg-white/20"
            >
              بازگشت به خانه
            </a>
          </div>

          <p className="mb-6 text-center text-sm text-white/50">
            نیاز به کمک دارید؟{' '}
            <a href="mailto:contact@hooshagar.ir" className="text-blue-400 hover:underline">
              پشتیبانی
            </a>
          </p>

          <div className="border-t border-white/10 pt-6">
            <button
              type="button"
              onClick={() => setShowDetails((v) => !v)}
              className="w-full py-2 text-sm text-white/50 transition-colors hover:text-white/70"
            >
              {showDetails ? 'پنهان کردن جزئیات فنی' : 'جزئیات فنی'}
            </button>

            {showDetails ? (
              <div className="mt-4 space-y-3">
                <div className="rounded-lg bg-white/5 p-3">
                  <p className="mb-1 text-xs text-white/40">نوع خطا</p>
                  <p className="font-mono text-sm text-red-400">{error.name}</p>
                </div>
                <div className="rounded-lg bg-white/5 p-3">
                  <p className="mb-1 text-xs text-white/40">پیام</p>
                  <p className="break-all font-mono text-sm text-white/80">
                    {error.message || 'خطای ناشناخته'}
                  </p>
                </div>
                {error.digest ? (
                  <div className="rounded-lg bg-white/5 p-3">
                    <p className="mb-1 text-xs text-white/40">شناسه خطا</p>
                    <p className="font-mono text-sm text-white/60">{error.digest}</p>
                  </div>
                ) : null}
                {isDevelopment && error.stack ? (
                  <div className="rounded-lg bg-white/5 p-3">
                    <p className="mb-1 text-xs text-white/40">Stack Trace</p>
                    <pre className="max-h-40 overflow-auto whitespace-pre-wrap font-mono text-xs text-white/60">
                      {error.stack}
                    </pre>
                  </div>
                ) : null}
              </div>
            ) : null}
          </div>
        </div>

        <p className="mt-6 text-center text-xs text-white/30">
          سیستم هوشمند مدیریت مدارس - هوشاگر
        </p>
      </div>
    </div>
  )
}
