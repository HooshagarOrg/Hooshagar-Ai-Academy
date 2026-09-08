/**
 * ویترین ویدیو — HTML سرور. پخش با اسکریپت وانیلا بعد از اسکرول.
 */

import { brandAssets } from '@/lib/brand'

export function CinematicVideoStatic(): JSX.Element {
  return (
    <section
      id="cinematic"
      className="relative min-h-[100svh] w-full overflow-hidden"
      aria-label="ویترین زنده هوشاگر"
    >
      <div className="absolute inset-0">
        <div
          className="absolute inset-0"
          style={{
            background:
              'radial-gradient(ellipse 80% 60% at 50% 40%, rgba(139,124,255,0.28), transparent 62%), var(--lux-void)',
          }}
          aria-hidden="true"
        />
        <video
          id="lp-cinematic-video"
          className="absolute inset-0 h-full w-full object-cover"
          muted
          loop
          playsInline
          preload="none"
        >
          <source src={brandAssets.heroVideo} type="video/mp4" />
        </video>
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              'linear-gradient(180deg, rgba(11,13,18,0.72) 0%, rgba(11,13,18,0.35) 35%, rgba(11,13,18,0.35) 65%, rgba(11,13,18,0.82) 100%)',
          }}
          aria-hidden="true"
        />
      </div>

      <div className="relative z-10 flex min-h-[100svh] flex-col items-center justify-center px-4 py-20 text-center">
        <p className="lux-kicker lp-kicker-gold mb-4">تجربهٔ بصری</p>
        <h2 className="lux-h2 mx-auto max-w-3xl">
          جهان <span className="lp-gradient-text-animated">هوشاگر</span>
        </h2>
        <p className="lux-body mx-auto mt-5 max-w-xl text-[var(--lux-text-muted)]">
          نگاهی کوتاه به جهانی که آموزش، هوش مصنوعی و مدیریت مدرسه در آن یکی می‌شوند.
        </p>
      </div>
    </section>
  )
}
