'use client'

import { useEffect, useRef } from 'react'
import { useReducedMotion } from 'framer-motion'
import { cn } from '@/lib/utils'

interface ArcDef {
  color: string
  startAngle: number
  endAngle: number
  radius: number
  width: number
  opacity: number
  speed: number   /* rad per second */
  blur: number
}

const ARCS: ArcDef[] = [
  // آبی — بازوی چپ لوگو
  { color: '#3B82F6', startAngle: Math.PI, endAngle: 2.2 * Math.PI, radius: 0.38, width: 0.07, opacity: 0.85, speed: 0.18,  blur: 0 },
  // سبز — بازوی بالا-راست
  { color: '#10B981', startAngle: 1.5 * Math.PI, endAngle: 2.6 * Math.PI, radius: 0.32, width: 0.055, opacity: 0.8, speed: -0.14, blur: 0 },
  // زرد — بازوی پایین-چپ
  { color: '#F59E0B', startAngle: 0.8 * Math.PI, endAngle: 1.85 * Math.PI, radius: 0.26, width: 0.05, opacity: 0.78, speed: 0.22, blur: 0 },
  // صورتی — بازوی راست
  { color: '#EC4899', startAngle: 0.2 * Math.PI, endAngle: 1.3 * Math.PI, radius: 0.36, width: 0.06, opacity: 0.75, speed: -0.16, blur: 0 },
  // قرمز/مرجانی — بازوی پایین-راست
  { color: '#EF4444', startAngle: 0.5 * Math.PI, endAngle: 1.4 * Math.PI, radius: 0.29, width: 0.05, opacity: 0.7, speed: 0.12, blur: 0 },
  // هاله‌های گلو
  { color: '#3B82F6', startAngle: 0, endAngle: 2 * Math.PI, radius: 0.44, width: 0.12, opacity: 0.06, speed: 0.04, blur: 14 },
  { color: '#10B981', startAngle: 0, endAngle: 2 * Math.PI, radius: 0.34, width: 0.1,  opacity: 0.06, speed: -0.03, blur: 18 },
]

interface ArcBloomProps {
  className?: string
  size?: number       /* px — پیش‌فرض responsive */
  intensity?: number  /* 0–1 */
}

export function ArcBloom({ className, size, intensity = 1 }: ArcBloomProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const rafRef   = useRef<number>(0)
  const reduce   = useReducedMotion()

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    let disposed = false
    const start = performance.now()

    const resize = () => {
      const s = size ?? (canvas.parentElement?.offsetWidth ?? 480)
      const dpr = Math.min(window.devicePixelRatio || 1, 2)
      canvas.width  = Math.floor(s * dpr)
      canvas.height = Math.floor(s * dpr)
      canvas.style.width  = `${s}px`
      canvas.style.height = `${s}px`
    }
    resize()
    const ro = new ResizeObserver(resize)
    if (canvas.parentElement) ro.observe(canvas.parentElement)

    const draw = (now: number) => {
      if (disposed) return
      const t = reduce ? 0 : (now - start) / 1000
      const w = canvas.width
      const h = canvas.height
      const cx = w / 2
      const cy = h / 2
      const baseR = Math.min(w, h) * 0.42

      ctx.clearRect(0, 0, w, h)

      for (const arc of ARCS) {
        const angle = t * arc.speed
        const sA = arc.startAngle + angle
        const eA = arc.endAngle  + angle
        const r  = baseR * arc.radius / 0.38

        if (arc.blur > 0) {
          ctx.save()
          ctx.filter = `blur(${arc.blur}px)`
        }

        ctx.beginPath()
        ctx.arc(cx, cy, r, sA, eA)
        ctx.strokeStyle = arc.color
        ctx.lineWidth   = baseR * arc.width
        ctx.globalAlpha = arc.opacity * intensity
        ctx.lineCap     = 'round'
        ctx.stroke()

        if (arc.blur > 0) {
          ctx.restore()
        }
        ctx.globalAlpha = 1
      }

      // کره سفید مرکزی
      const coreR = baseR * 0.06
      const grd = ctx.createRadialGradient(cx, cy, 0, cx, cy, coreR * 2.5)
      grd.addColorStop(0, `rgba(255,255,255,${0.9 * intensity})`)
      grd.addColorStop(0.4, `rgba(200,220,255,${0.55 * intensity})`)
      grd.addColorStop(1, 'rgba(255,255,255,0)')
      ctx.beginPath()
      ctx.arc(cx, cy, coreR * 2.5, 0, 2 * Math.PI)
      ctx.fillStyle = grd
      ctx.fill()

      ctx.beginPath()
      ctx.arc(cx, cy, coreR, 0, 2 * Math.PI)
      ctx.fillStyle = `rgba(255,255,255,${0.92 * intensity})`
      ctx.fill()

      if (!reduce) rafRef.current = requestAnimationFrame(draw)
    }

    if (reduce) {
      rafRef.current = requestAnimationFrame(draw)
    } else {
      rafRef.current = requestAnimationFrame(draw)
    }

    return () => {
      disposed = true
      cancelAnimationFrame(rafRef.current)
      ro.disconnect()
    }
  }, [reduce, size, intensity])

  return (
    <canvas
      ref={canvasRef}
      className={cn('block', className)}
      aria-hidden
    />
  )
}
