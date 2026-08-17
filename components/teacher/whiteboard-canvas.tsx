'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { Eraser, Pen, Trash2, Hand } from 'lucide-react'

export type DrawTool = 'pen' | 'eraser'
export type InteractionMode = 'draw' | 'browse'

const COLORS = [
  { id: 'ink', value: '#0f172a', label: 'مشکی' },
  { id: 'red', value: '#dc2626', label: 'قرمز' },
  { id: 'blue', value: '#2563eb', label: 'آبی' },
  { id: 'green', value: '#16a34a', label: 'سبز' },
  { id: 'amber', value: '#d97706', label: 'نارنجی' },
] as const

type WhiteboardCanvasProps = {
  /** پس‌زمینه سفید برای تخته خالی؛ شفاف برای روی PDF */
  transparent?: boolean
  className?: string
  /** نمایش دکمه حالت مرور (برای PDF) */
  showBrowseMode?: boolean
  /** حالت اولیه — برای PDF بهتر است browse باشد تا کتاب دیده شود */
  defaultMode?: InteractionMode
  onModeChange?: (mode: InteractionMode) => void
}

type Point = { x: number; y: number }

export function WhiteboardCanvas({
  transparent = false,
  className,
  showBrowseMode = false,
  defaultMode = 'draw',
  onModeChange,
}: WhiteboardCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const drawing = useRef(false)
  const lastPoint = useRef<Point | null>(null)
  const [tool, setTool] = useState<DrawTool>('pen')
  const [color, setColor] = useState<string>(COLORS[0].value)
  const [lineWidth, setLineWidth] = useState(3)
  const [mode, setMode] = useState<InteractionMode>(defaultMode)

  const resizeCanvas = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const parent = canvas.parentElement
    if (!parent) return

    const rect = parent.getBoundingClientRect()
    const dpr = Math.min(window.devicePixelRatio || 1, 2)
    const w = Math.max(1, Math.floor(rect.width))
    const h = Math.max(1, Math.floor(rect.height))

    const prev = document.createElement('canvas')
    prev.width = canvas.width
    prev.height = canvas.height
    const prevCtx = prev.getContext('2d')
    if (prevCtx && canvas.width > 0) {
      prevCtx.drawImage(canvas, 0, 0)
    }

    canvas.width = Math.floor(w * dpr)
    canvas.height = Math.floor(h * dpr)
    canvas.style.width = `${w}px`
    canvas.style.height = `${h}px`

    const ctx = canvas.getContext('2d')
    if (!ctx) return
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0)

    if (!transparent) {
      ctx.fillStyle = '#ffffff'
      ctx.fillRect(0, 0, w, h)
    }

    if (prev.width > 0) {
      ctx.drawImage(prev, 0, 0, w, h)
    }
  }, [transparent])

  useEffect(() => {
    resizeCanvas()
    const onResize = () => resizeCanvas()
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [resizeCanvas])

  useEffect(() => {
    onModeChange?.(mode)
  }, [mode, onModeChange])

  const getPoint = (e: React.PointerEvent<HTMLCanvasElement>): Point => {
    const canvas = canvasRef.current
    if (!canvas) return { x: 0, y: 0 }
    const rect = canvas.getBoundingClientRect()
    return { x: e.clientX - rect.left, y: e.clientY - rect.top }
  }

  const stroke = (from: Point, to: Point) => {
    const canvas = canvasRef.current
    const ctx = canvas?.getContext('2d')
    if (!ctx) return

    ctx.lineCap = 'round'
    ctx.lineJoin = 'round'
    ctx.lineWidth = tool === 'eraser' ? Math.max(lineWidth * 4, 16) : lineWidth

    if (tool === 'eraser') {
      if (transparent) {
        ctx.globalCompositeOperation = 'destination-out'
        ctx.strokeStyle = 'rgba(0,0,0,1)'
      } else {
        ctx.globalCompositeOperation = 'source-over'
        ctx.strokeStyle = '#ffffff'
      }
    } else {
      ctx.globalCompositeOperation = 'source-over'
      ctx.strokeStyle = color
    }

    ctx.beginPath()
    ctx.moveTo(from.x, from.y)
    ctx.lineTo(to.x, to.y)
    ctx.stroke()
  }

  const onPointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (mode !== 'draw') return
    e.currentTarget.setPointerCapture(e.pointerId)
    drawing.current = true
    lastPoint.current = getPoint(e)
  }

  const onPointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!drawing.current || mode !== 'draw' || !lastPoint.current) return
    const next = getPoint(e)
    stroke(lastPoint.current, next)
    lastPoint.current = next
  }

  const onPointerUp = () => {
    drawing.current = false
    lastPoint.current = null
  }

  const clearCanvas = () => {
    const canvas = canvasRef.current
    const ctx = canvas?.getContext('2d')
    if (!canvas || !ctx) return
    const w = canvas.clientWidth
    const h = canvas.clientHeight
    const dpr = Math.min(window.devicePixelRatio || 1, 2)
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    if (transparent) {
      ctx.clearRect(0, 0, w, h)
    } else {
      ctx.globalCompositeOperation = 'source-over'
      ctx.fillStyle = '#ffffff'
      ctx.fillRect(0, 0, w, h)
    }
  }

  const browsing = mode === 'browse'

  return (
    <div
      className={cn(
        'relative flex h-full min-h-0 flex-col',
        // اجازه عبور کلیک به PDF وقتی در حالت ورق زدن هستیم
        browsing && 'pointer-events-none',
        className
      )}
    >
      <div
        className="pointer-events-auto flex flex-wrap items-center gap-2 border-b border-border/60 bg-background/95 px-3 py-2 backdrop-blur"
        dir="rtl"
      >
        {showBrowseMode && (
          <Button
            type="button"
            size="sm"
            variant={mode === 'browse' ? 'default' : 'outline'}
            onClick={() => setMode('browse')}
            aria-pressed={mode === 'browse'}
          >
            <Hand className="size-4" />
            ورق زدن PDF
          </Button>
        )}
        <Button
          type="button"
          size="sm"
          variant={mode === 'draw' && tool === 'pen' ? 'default' : 'outline'}
          onClick={() => {
            setMode('draw')
            setTool('pen')
          }}
          aria-pressed={mode === 'draw' && tool === 'pen'}
        >
          <Pen className="size-4" />
          قلم
        </Button>
        <Button
          type="button"
          size="sm"
          variant={mode === 'draw' && tool === 'eraser' ? 'default' : 'outline'}
          onClick={() => {
            setMode('draw')
            setTool('eraser')
          }}
          aria-pressed={mode === 'draw' && tool === 'eraser'}
        >
          <Eraser className="size-4" />
          پاک‌کن
        </Button>

        <div className="flex items-center gap-1.5" role="group" aria-label="رنگ قلم">
          {COLORS.map((c) => (
            <button
              key={c.id}
              type="button"
              title={c.label}
              aria-label={c.label}
              onClick={() => {
                setMode('draw')
                setTool('pen')
                setColor(c.value)
              }}
              className={cn(
                'size-7 rounded-full border-2 transition',
                color === c.value && tool === 'pen'
                  ? 'scale-110 border-primary'
                  : 'border-transparent'
              )}
              style={{ backgroundColor: c.value }}
            />
          ))}
        </div>

        <label className="flex items-center gap-2 text-xs text-muted-foreground">
          ضخامت
          <input
            type="range"
            min={1}
            max={12}
            value={lineWidth}
            onChange={(e) => setLineWidth(Number(e.target.value))}
            className="w-24"
            aria-label="ضخامت خط"
          />
        </label>

        <Button type="button" size="sm" variant="outline" onClick={clearCanvas}>
          <Trash2 className="size-4" />
          پاک کردن همه
        </Button>

        <p className="mr-auto text-xs text-muted-foreground">
          یادداشت‌ها ذخیره نمی‌شوند
        </p>
      </div>

      <div
        className={cn(
          'relative min-h-0 flex-1 overflow-hidden',
          transparent ? 'bg-transparent' : 'bg-white',
          !browsing && 'pointer-events-auto'
        )}
      >
        <canvas
          ref={canvasRef}
          className={cn(
            'absolute inset-0 h-full w-full touch-none bg-transparent',
            browsing ? 'pointer-events-none' : 'cursor-crosshair'
          )}
          style={{ background: 'transparent' }}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerCancel={onPointerUp}
          aria-label="بوم نقاشی"
        />
      </div>
    </div>
  )
}
