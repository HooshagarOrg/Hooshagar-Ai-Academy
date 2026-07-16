'use client'

import { useEffect, useRef } from 'react'

declare global {
  interface Window {
    turnstile?: {
      render: (
        el: HTMLElement,
        options: {
          sitekey: string
          callback: (token: string) => void
          'expired-callback'?: () => void
          theme?: 'light' | 'dark' | 'auto'
          language?: string
        }
      ) => string
      reset: (widgetId?: string) => void
      remove: (widgetId?: string) => void
    }
  }
}

interface TurnstileWidgetProps {
  siteKey: string
  onToken: (token: string | null) => void
}

export function TurnstileWidget({ siteKey, onToken }: TurnstileWidgetProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const widgetIdRef = useRef<string | null>(null)
  const onTokenRef = useRef(onToken)
  onTokenRef.current = onToken

  useEffect(() => {
    let cancelled = false

    const render = () => {
      if (cancelled || !containerRef.current || !window.turnstile) return
      if (widgetIdRef.current) {
        try {
          window.turnstile.remove(widgetIdRef.current)
        } catch {
          // ignore
        }
        widgetIdRef.current = null
      }
      widgetIdRef.current = window.turnstile.render(containerRef.current, {
        sitekey: siteKey,
        language: 'fa',
        theme: 'auto',
        callback: (token) => onTokenRef.current(token),
        'expired-callback': () => onTokenRef.current(null),
      })
    }

    const existing = document.querySelector<HTMLScriptElement>(
      'script[data-hooshagar-turnstile="1"]'
    )
    if (window.turnstile) {
      render()
    } else if (existing) {
      existing.addEventListener('load', render)
    } else {
      const script = document.createElement('script')
      script.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit'
      script.async = true
      script.defer = true
      script.dataset.hooshagarTurnstile = '1'
      script.addEventListener('load', render)
      document.head.appendChild(script)
    }

    return () => {
      cancelled = true
      if (widgetIdRef.current && window.turnstile) {
        try {
          window.turnstile.remove(widgetIdRef.current)
        } catch {
          // ignore
        }
      }
    }
  }, [siteKey])

  return (
    <div className="flex justify-center py-2" aria-label="تأیید امنیتی">
      <div ref={containerRef} />
    </div>
  )
}
