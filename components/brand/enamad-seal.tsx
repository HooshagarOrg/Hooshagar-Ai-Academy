'use client'

import { useEffect, useState } from 'react'

const ENAMAD_ID = '7213404'
const ENAMAD_CODE = 'GdmrGFomwTEcuHOMntNBlhwbUPb3LmNR'
const ENAMAD_HREF = `https://trustseal.enamad.ir/?id=${ENAMAD_ID}&Code=${ENAMAD_CODE}`
const ENAMAD_SRC = `https://trustseal.enamad.ir/logo.aspx?id=${ENAMAD_ID}&Code=${ENAMAD_CODE}`
/** Fallback when trustseal.enamad.ir is unreachable or times out. */
const ENAMAD_FALLBACK = '/brand/enamad.svg'
const LOAD_TIMEOUT_MS = 5000

/**
 * نشان اعتماد اینماد — الزامی برای نمایش در فوتر عمومی
 *
 * تصویر رسمی از trustseal لود می‌شود؛ اگر شبکه قطع/کند باشد، نسخهٔ محلی نشان داده می‌شود.
 * لینک اعتبارسنجی همیشه به پنل رسمی اینماد می‌رود.
 */
export function EnamadSeal({ className = '' }: { className?: string }): JSX.Element {
  const [src, setSrc] = useState(ENAMAD_SRC)

  useEffect(() => {
    let cancelled = false
    const probe = new Image()
    probe.referrerPolicy = 'origin'

    const timer = window.setTimeout(() => {
      if (!cancelled) setSrc(ENAMAD_FALLBACK)
    }, LOAD_TIMEOUT_MS)

    probe.onload = () => {
      window.clearTimeout(timer)
      if (!cancelled) setSrc(ENAMAD_SRC)
    }
    probe.onerror = () => {
      window.clearTimeout(timer)
      if (!cancelled) setSrc(ENAMAD_FALLBACK)
    }
    probe.src = `${ENAMAD_SRC}&_=${Date.now()}`

    return () => {
      cancelled = true
      window.clearTimeout(timer)
    }
  }, [])

  return (
    <a
      referrerPolicy="origin"
      target="_blank"
      rel="noopener"
      href={ENAMAD_HREF}
      className={`inline-flex shrink-0 items-center justify-center ${className}`}
      aria-label="نماد اعتماد الکترونیکی"
      title="نماد اعتماد الکترونیکی"
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        referrerPolicy="origin"
        src={src}
        alt="نماد اعتماد الکترونیکی"
        width={125}
        height={125}
        className="h-[72px] w-[72px] cursor-pointer object-contain sm:h-[88px] sm:w-[88px]"
        // ویژگی رسمی اینماد برای اعتبارسنجی نشان
        id={ENAMAD_CODE}
        {...{ code: ENAMAD_CODE }}
        onError={() => {
          if (src !== ENAMAD_FALLBACK) setSrc(ENAMAD_FALLBACK)
        }}
      />
    </a>
  )
}
