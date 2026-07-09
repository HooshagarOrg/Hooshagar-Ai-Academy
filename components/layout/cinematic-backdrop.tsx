'use client'

/**
 * پس‌زمینهٔ سینمایی مشترک — ویدیو (در صورت وجود) + گرادیان + نویز
 */

import { useEffect, useRef, useState } from 'react'
import { brandAssets } from '@/lib/brand'

interface CinematicBackdropProps {
  className?: string
  showVideo?: boolean
  dim?: number
}

export function CinematicBackdrop({
  className = '',
  showVideo = false,
  dim = 0.55,
}: CinematicBackdropProps): JSX.Element {
  const videoRef = useRef<HTMLVideoElement>(null)
  const [videoOk, setVideoOk] = useState(false)

  useEffect(() => {
    const v = videoRef.current
    if (!v || !showVideo) return
    v.play().catch(() => setVideoOk(false))
  }, [showVideo])

  return (
    <div className={`pointer-events-none absolute inset-0 overflow-hidden ${className}`} aria-hidden="true">
      {showVideo && (
        <video
          ref={videoRef}
          className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-700 ${videoOk ? 'opacity-100' : 'opacity-0'}`}
          autoPlay
          muted
          loop
          playsInline
          preload="metadata"
          poster={brandAssets.logo}
          onCanPlay={() => setVideoOk(true)}
          onError={() => setVideoOk(false)}
        >
          <source src={brandAssets.heroVideo} type="video/mp4" />
        </video>
      )}

      {/* fallback aurora when video absent */}
      <div
        className="absolute inset-0"
        style={{
          opacity: videoOk ? dim : 1,
          background:
            'radial-gradient(ellipse 80% 55% at 50% 0%, rgba(139,124,255,0.22), transparent 58%), radial-gradient(ellipse 60% 50% at 100% 100%, rgba(84,210,255,0.14), transparent 52%), radial-gradient(ellipse 55% 45% at 0% 80%, rgba(201,169,98,0.1), transparent 50%), var(--lux-void)',
        }}
      />

      {videoOk && (
        <div
          className="absolute inset-0"
          style={{ background: `rgba(11,13,18,${dim})` }}
        />
      )}

      <div className="lp-beam right-[12%] top-0 h-full opacity-50" />
      <div className="lp-beam left-[18%] top-0 h-full opacity-35" />
    </div>
  )
}
