'use client'

import { useEffect, useRef, useState } from 'react'
import { motion, useMotionValue, useSpring, useReducedMotion } from 'framer-motion'
import { ArcBloom } from '@/components/motion/arc-bloom'
import { brandAssets } from '@/lib/brand'
import { cn } from '@/lib/utils'

interface HeroVideoStageProps {
  className?: string
  src?: string
  poster?: string
  theme?: 'light' | 'dark'
  compact?: boolean
  /** برای ویدیوهای cinematic — بدون لایه ArcBloom */
  showArcBloom?: boolean
}

/**
 * HeroVideoStage — ویدیو در قاب ۳D با tilt ماوس و گلو Chromatic
 */
export function HeroVideoStage({
  className,
  src = brandAssets.heroVideo,
  poster,
  theme = 'light',
  compact = false,
  showArcBloom = true,
}: HeroVideoStageProps) {
  const reduce = useReducedMotion()
  const isDark = theme === 'dark'
  const stageRef = useRef<HTMLDivElement>(null)
  const videoRef = useRef<HTMLVideoElement>(null)
  const [ready, setReady] = useState(false)

  const rotateX = useSpring(useMotionValue(0), { stiffness: 120, damping: 18 })
  const rotateY = useSpring(useMotionValue(0), { stiffness: 120, damping: 18 })

  useEffect(() => {
    const v = videoRef.current
    if (!v) return
    const play = () => v.play().catch(() => {})
    v.addEventListener('canplay', play)
    play()
    return () => v.removeEventListener('canplay', play)
  }, [])

  const onMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (reduce || !stageRef.current) return
    const rect = stageRef.current.getBoundingClientRect()
    const x = (e.clientX - rect.left) / rect.width - 0.5
    const y = (e.clientY - rect.top) / rect.height - 0.5
    rotateY.set(x * 14)
    rotateX.set(-y * 10)
  }

  const onLeave = () => {
    rotateX.set(0)
    rotateY.set(0)
  }

  return (
    <div
      ref={stageRef}
      className={cn(
        'relative w-full mx-auto',
        compact ? 'max-w-[min(88vw,320px)]' : 'max-w-[min(92vw,560px)]',
        className,
      )}
      style={{ perspective: 1200 }}
      onMouseMove={onMove}
      onMouseLeave={onLeave}
    >
      <div
        className={cn(
          'absolute rounded-[2.5rem] blur-3xl pointer-events-none animate-arc-glow-pulse',
          compact ? '-inset-4 opacity-50' : '-inset-8 opacity-60',
        )}
        style={{
          background: isDark
            ? 'radial-gradient(circle at 30% 40%, rgba(139,124,255,0.38), transparent 55%), radial-gradient(circle at 70% 60%, rgba(84,210,255,0.28), transparent 50%)'
            : 'radial-gradient(circle at 30% 40%, rgba(139,124,255,0.28), transparent 55%), radial-gradient(circle at 70% 60%, rgba(84,210,255,0.24), transparent 50%)',
        }}
        aria-hidden
      />

      <motion.div
        className="relative"
        style={{
          rotateX: reduce ? 0 : rotateX,
          rotateY: reduce ? 0 : rotateY,
          transformStyle: 'preserve-3d',
        }}
        initial={reduce ? false : { opacity: 0, y: 40, scale: 0.92 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
      >
        <div
          className="rounded-[1.75rem] p-[2px]"
          style={{
            background:
              'linear-gradient(135deg, #8B7CFF 0%, #54D2FF 38%, #FF4DA6 72%, #FFB347 100%)',
            boxShadow: isDark
              ? '0 32px 80px rgba(0,0,0,0.45), 0 0 80px rgba(139,124,255,0.28), inset 0 1px 0 rgba(255,255,255,0.15)'
              : '0 32px 80px rgba(30,41,59,0.14), 0 0 60px rgba(139,124,255,0.16), inset 0 1px 0 rgba(255,255,255,0.8)',
          }}
        >
          <div
            className={cn(
              'relative rounded-[1.65rem] overflow-hidden',
              isDark ? 'bg-[#0d1017]' : 'bg-white',
            )}
            style={{ transform: 'translateZ(24px)' }}
          >
            <video
              ref={videoRef}
              className={cn(
                'w-full object-cover block transition-opacity duration-700',
                compact ? 'aspect-[4/3]' : 'aspect-[16/9]',
                ready ? 'opacity-100' : 'opacity-0',
              )}
              autoPlay
              muted
              loop
              playsInline
              poster={poster}
              onLoadedData={() => setReady(true)}
            >
              <source src={src} type="video/mp4" />
            </video>

            {showArcBloom && (
              <div className="absolute inset-0 pointer-events-none mix-blend-screen opacity-50">
                <ArcBloom className="w-full h-full" intensity={isDark ? 0.4 : 0.65} />
              </div>
            )}

            <div
              className="absolute inset-0 pointer-events-none"
              style={{
                background: isDark
                  ? showArcBloom
                    ? 'linear-gradient(180deg, rgba(18,21,28,0.08) 0%, transparent 40%, transparent 70%, rgba(18,21,28,0.22) 100%)'
                    : 'linear-gradient(180deg, transparent 0%, transparent 75%, rgba(18,21,28,0.18) 100%)'
                  : 'linear-gradient(180deg, rgba(230,235,244,0.08) 0%, transparent 35%, transparent 65%, rgba(17,24,39,0.15) 100%)',
              }}
            />

            <div
              className={cn(
                'absolute top-4 right-4 flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold',
                isDark ? 'text-white' : 'text-[#111827]',
              )}
              style={{
                background: isDark ? 'rgba(18,21,28,0.72)' : 'rgba(255,255,255,0.78)',
                backdropFilter: 'blur(12px)',
                border: isDark
                  ? '1px solid rgba(255,255,255,0.12)'
                  : '1px solid rgba(148,163,184,0.18)',
              }}
            >
              <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
              پیش‌نمایش زنده
            </div>
          </div>
        </div>

        <div
          className="absolute -bottom-6 left-1/2 -translate-x-1/2 w-[75%] h-8 rounded-[100%] blur-xl opacity-40"
          style={{
            background: isDark
              ? 'radial-gradient(ellipse, rgba(139,124,255,0.45), transparent 70%)'
              : 'radial-gradient(ellipse, rgba(139,124,255,0.32), transparent 70%)',
            transform: 'translateZ(-40px) rotateX(90deg)',
          }}
          aria-hidden
        />
      </motion.div>

      {!reduce &&
        ['#3B82F6', '#10B981', '#EC4899', '#F59E0B'].map((color, i) => (
          <motion.span
            key={color}
            className="absolute w-2 h-2 rounded-full pointer-events-none"
            style={{
              background: color,
              boxShadow: `0 0 12px ${color}`,
              top: `${15 + i * 18}%`,
              right: i % 2 === 0 ? '-4%' : 'auto',
              left: i % 2 === 1 ? '-4%' : 'auto',
            }}
            animate={{ y: [0, -12, 0], opacity: [0.4, 1, 0.4] }}
            transition={{ duration: 3 + i * 0.5, repeat: Infinity, ease: 'easeInOut' }}
          />
        ))}
    </div>
  )
}
