'use client'

/**
 * بردارهای تزئینی شناور برای حس «نفس کشیدن» صفحه
 * لوگو و ویدیو را لمس نمی‌کند.
 */

export function AmbientVectors(): JSX.Element {
  return (
    <div className="pointer-events-none fixed inset-0 z-[2] overflow-hidden" aria-hidden>
      {/* اُرب‌های رنگی نرم */}
      <span className="lp-orb lp-orb--a" />
      <span className="lp-orb lp-orb--b" />
      <span className="lp-orb lp-orb--c" />

      {/* بردارهای هندسی */}
      <svg className="lp-float-vector lp-float-vector--1" viewBox="0 0 80 80" width="80" height="80">
        <polygon
          points="40,6 74,66 6,66"
          fill="none"
          stroke="rgba(139,124,255,0.35)"
          strokeWidth="1.5"
        />
      </svg>
      <svg className="lp-float-vector lp-float-vector--2" viewBox="0 0 72 72" width="72" height="72">
        <circle cx="36" cy="36" r="28" fill="none" stroke="rgba(84,210,255,0.3)" strokeWidth="1.5" strokeDasharray="6 8" />
      </svg>
      <svg className="lp-float-vector lp-float-vector--3" viewBox="0 0 64 64" width="64" height="64">
        <rect
          x="10"
          y="10"
          width="44"
          height="44"
          rx="10"
          fill="none"
          stroke="rgba(255,77,166,0.28)"
          strokeWidth="1.5"
          transform="rotate(18 32 32)"
        />
      </svg>
      <svg className="lp-float-vector lp-float-vector--4" viewBox="0 0 60 60" width="60" height="60">
        <path
          d="M8 30 L30 8 L52 30 L30 52 Z"
          fill="none"
          stroke="rgba(201,169,98,0.32)"
          strokeWidth="1.4"
        />
      </svg>
    </div>
  )
}
