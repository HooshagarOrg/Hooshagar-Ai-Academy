'use client'

/**
 * میدان ستاره‌ای Canvas — بعد از idle شروع می‌شود تا TBT هیرو را نخورد.
 */

import { useEffect, useRef } from 'react'

interface Star {
  x: number
  y: number
  z: number
  r: number
  hue: number
  tw: number
}

interface StarfieldCanvasProps {
  density?: number
  brightness?: number
  className?: string
}

export function StarfieldCanvas({
  density = 1,
  brightness = 1,
  className = 'absolute inset-0 h-full w-full',
}: StarfieldCanvasProps): JSX.Element {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const ctx = canvas.getContext('2d', { alpha: true })
    if (!ctx) return

    let width = 0
    let height = 0
    let raf = 0
    let stars: Star[] = []
    const pointer = { x: 0.5, y: 0.5 }
    const hues = [252, 195, 44]
    let running = false
    let cancelled = false

    const resize = (): void => {
      const dpr = Math.min(window.devicePixelRatio || 1, 1.5)
      width = canvas.clientWidth
      height = canvas.clientHeight
      canvas.width = width * dpr
      canvas.height = height * dpr
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
      const count = Math.min(80, Math.floor((width * height) / (16000 / density)))
      stars = Array.from({ length: count }, () => ({
        x: Math.random() * width,
        y: Math.random() * height,
        z: 0.25 + Math.random() * 0.75,
        r: 0.6 + Math.random() * 2,
        hue: hues[Math.floor(Math.random() * hues.length)] ?? 252,
        tw: Math.random() * Math.PI * 2,
      }))
    }

    const draw = (t: number): void => {
      if (!running) return
      ctx.clearRect(0, 0, width, height)
      const px = (pointer.x - 0.5) * 24
      const py = (pointer.y - 0.5) * 24
      for (const s of stars) {
        const twinkle = 0.55 + 0.45 * Math.sin(t * 0.0011 + s.tw)
        const x = s.x + px * s.z
        const y = s.y + py * s.z - (reduced ? 0 : (t * 0.008 * s.z) % height)
        const yy = ((y % height) + height) % height
        ctx.beginPath()
        ctx.arc(x, yy, s.r * s.z, 0, Math.PI * 2)
        const alpha = Math.min(1, 0.58 * twinkle * s.z * brightness)
        ctx.fillStyle = `hsla(${s.hue}, 85%, 78%, ${alpha})`
        ctx.fill()
      }
      raf = requestAnimationFrame(draw)
    }

    const setRunning = (next: boolean): void => {
      if (next === running) return
      running = next
      if (running) {
        raf = requestAnimationFrame(draw)
      } else {
        cancelAnimationFrame(raf)
      }
    }

    const onPointer = (e: PointerEvent): void => {
      pointer.x = e.clientX / window.innerWidth
      pointer.y = e.clientY / window.innerHeight
    }

    const onVisibility = (): void => {
      setRunning(!document.hidden && !reduced)
    }

    resize()
    window.addEventListener('resize', resize)
    document.addEventListener('visibilitychange', onVisibility)

    const start = (): void => {
      if (cancelled) return
      if (!reduced) {
        window.addEventListener('pointermove', onPointer, { passive: true })
        onVisibility()
      } else {
        running = true
        draw(0)
        setRunning(false)
      }
    }

    const idle =
      typeof window.requestIdleCallback === 'function'
        ? window.requestIdleCallback(start, { timeout: 8000 })
        : window.setTimeout(start, 4000)

    return () => {
      cancelled = true
      setRunning(false)
      cancelAnimationFrame(raf)
      window.removeEventListener('resize', resize)
      window.removeEventListener('pointermove', onPointer)
      document.removeEventListener('visibilitychange', onVisibility)
      if (typeof window.cancelIdleCallback === 'function' && typeof idle === 'number') {
        window.cancelIdleCallback(idle)
      } else {
        window.clearTimeout(idle as number)
      }
    }
  }, [brightness, density])

  return <canvas ref={canvasRef} className={className} aria-hidden="true" />
}
