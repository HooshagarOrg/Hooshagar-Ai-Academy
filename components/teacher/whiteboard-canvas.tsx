'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { Eraser, Maximize2, Minimize2, Pen, Trash2, Hand } from 'lucide-react'

export type DrawTool = 'pen' | 'eraser'
export type InteractionMode = 'draw' | 'browse'
export type BoardSurface = 'white' | 'black'

const BOARD_FILL: Record<BoardSurface, string> = {
  white: '#ffffff',
  black: '#111318',
}

const INK_BLACK = '#0f172a'
const INK_WHITE = '#f8fafc'

const COLORS = [
  { id: 'ink', value: INK_BLACK, label: 'مشکی' },
  { id: 'white', value: INK_WHITE, label: 'سفید' },
  { id: 'red', value: '#dc2626', label: 'قرمز' },
  { id: 'blue', value: '#2563eb', label: 'آبی' },
  { id: 'green', value: '#16a34a', label: 'سبز' },
  { id: 'amber', value: '#d97706', label: 'نارنجی' },
] as const

type FsElement = HTMLElement & {
  webkitRequestFullscreen?: () => Promise<void> | void
}

type FsDocument = Document & {
  webkitFullscreenElement?: Element | null
  webkitExitFullscreen?: () => Promise<void> | void
  webkitFullscreenEnabled?: boolean
}

function getFullscreenElement(): Element | null {
  const doc = document as FsDocument
  return document.fullscreenElement ?? doc.webkitFullscreenElement ?? null
}

function isFullscreenEnabled(): boolean {
  const doc = document as FsDocument
  return Boolean(document.fullscreenEnabled || doc.webkitFullscreenEnabled)
}

async function enterFullscreen(el: HTMLElement): Promise<void> {
  const node = el as FsElement
  if (node.requestFullscreen) {
    await node.requestFullscreen()
    return
  }
  if (node.webkitRequestFullscreen) {
    await node.webkitRequestFullscreen()
  }
}

async function exitFullscreen(): Promise<void> {
  const doc = document as FsDocument
  if (document.exitFullscreen) {
    await document.exitFullscreen()
    return
  }
  if (doc.webkitExitFullscreen) {
    await doc.webkitExitFullscreen()
  }
}

type WhiteboardCanvasProps = {
  /** پس‌زمینه سفید/مشکی برای تخته خالی؛ شفاف برای روی PDF */
  transparent?: boolean
  className?: string
  /** نمایش دکمه حالت مرور (برای PDF) */
  showBrowseMode?: boolean
  /** حالت اولیه — برای PDF بهتر است browse باشد تا کتاب دیده شود */
  defaultMode?: InteractionMode
  onModeChange?: (mode: InteractionMode) => void
  /** عنصر والد برای تمام‌صفحه (مثلاً PDF + لایه نقاشی) */
  fullscreenTargetRef?: React.RefObject<HTMLElement | null>
}

type Point = { x: number; y: number }

export function WhiteboardCanvas({
  transparent = false,
  className,
  showBrowseMode = false,
  defaultMode = 'draw',
  onModeChange,
  fullscreenTargetRef,
}: WhiteboardCanvasProps) {
  const rootRef = useRef<HTMLDivElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const drawing = useRef(false)
  const lastPoint = useRef<Point | null>(null)
  const [tool, setTool] = useState<DrawTool>('pen')
  const [color, setColor] = useState<string>(INK_BLACK)
  const [lineWidth, setLineWidth] = useState(3)
  const [mode, setMode] = useState<InteractionMode>(defaultMode)
  const [boardSurface, setBoardSurface] = useState<BoardSurface>('white')
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [canFullscreen, setCanFullscreen] = useState(false)

  const boardFill = BOARD_FILL[boardSurface]
  const boardFillRef = useRef(boardFill)
  boardFillRef.current = boardFill

  const fillBoard = useCallback(() => {
    const canvas = canvasRef.current
    const ctx = canvas?.getContext('2d')
    if (!canvas || !ctx) return
    const w = canvas.clientWidth
    const h = canvas.clientHeight
    const dpr = Math.min(window.devicePixelRatio || 1, 2)
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    if (transparent) {
      ctx.clearRect(0, 0, w, h)
      return
    }
    ctx.globalCompositeOperation = 'source-over'
    ctx.fillStyle = boardFillRef.current
    ctx.fillRect(0, 0, w, h)
  }, [transparent])

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
      ctx.fillStyle = boardFillRef.current
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
    setCanFullscreen(isFullscreenEnabled())
    const onFs = () => {
      setIsFullscreen(Boolean(getFullscreenElement()))
      requestAnimationFrame(() => resizeCanvas())
    }
    document.addEventListener('fullscreenchange', onFs)
    document.addEventListener('webkitfullscreenchange', onFs)
    return () => {
      document.removeEventListener('fullscreenchange', onFs)
      document.removeEventListener('webkitfullscreenchange', onFs)
    }
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
        ctx.strokeStyle = boardFill
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
    fillBoard()
  }

  const applyBoardSurface = (next: BoardSurface) => {
    if (next === boardSurface) return
    setBoardSurface(next)
    if (next === 'black' && color === INK_BLACK) setColor(INK_WHITE)
    if (next === 'white' && color === INK_WHITE) setColor(INK_BLACK)
    requestAnimationFrame(() => {
      const canvas = canvasRef.current
      const ctx = canvas?.getContext('2d')
      if (!canvas || !ctx) return
      const w = canvas.clientWidth
      const h = canvas.clientHeight
      const dpr = Math.min(window.devicePixelRatio || 1, 2)
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
      ctx.globalCompositeOperation = 'source-over'
      ctx.fillStyle = BOARD_FILL[next]
      ctx.fillRect(0, 0, w, h)
    })
  }

  const toggleFullscreen = async () => {
    const target = fullscreenTargetRef?.current ?? rootRef.current
    if (!target) return
    try {
      if (getFullscreenElement()) {
        await exitFullscreen()
      } else {
        await enterFullscreen(target)
      }
    } catch {
      // مرورگر ممکن است تمام‌صفحه را رد کند
    }
  }

  const browsing = mode === 'browse'

  return (
    <div
      ref={rootRef}
      className={cn(
        'relative flex h-full min-h-0 flex-col',
        '[&:fullscreen]:h-screen [&:fullscreen]:w-screen [&:fullscreen]:rounded-none',
        '[&:-webkit-full-screen]:h-screen [&:-webkit-full-screen]:w-screen [&:-webkit-full-screen]:rounded-none',
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
                c.id === 'white' && 'shadow-[inset_0_0_0_1px_rgba(15,23,42,0.25)]',
                color === c.value && tool === 'pen'
                  ? 'scale-110 border-primary'
                  : 'border-transparent'
              )}
              style={{ backgroundColor: c.value }}
            />
          ))}
        </div>

        {!transparent && (
          <div className="flex items-center gap-1.5" role="group" aria-label="رنگ تخته">
            <span className="text-xs text-muted-foreground">تخته</span>
            <button
              type="button"
              title="تخته سفید"
              aria-label="تخته سفید"
              aria-pressed={boardSurface === 'white'}
              onClick={() => applyBoardSurface('white')}
              className={cn(
                'size-7 rounded-md border-2 bg-white transition',
                boardSurface === 'white' ? 'scale-110 border-primary' : 'border-border'
              )}
            />
            <button
              type="button"
              title="تخته مشکی"
              aria-label="تخته مشکی"
              aria-pressed={boardSurface === 'black'}
              onClick={() => applyBoardSurface('black')}
              className={cn(
                'size-7 rounded-md border-2 bg-[#111318] transition',
                boardSurface === 'black' ? 'scale-110 border-primary' : 'border-border'
              )}
            />
          </div>
        )}

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

        {canFullscreen && (
          <Button
            type="button"
            size="sm"
            variant={isFullscreen ? 'default' : 'outline'}
            onClick={() => void toggleFullscreen()}
            aria-pressed={isFullscreen}
          >
            {isFullscreen ? <Minimize2 className="size-4" /> : <Maximize2 className="size-4" />}
            {isFullscreen ? 'خروج از تمام‌صفحه' : 'تمام‌صفحه'}
          </Button>
        )}

        <p className="mr-auto text-xs text-muted-foreground">
          یادداشت‌ها ذخیره نمی‌شوند
        </p>
      </div>

      <div
        className={cn(
          'relative min-h-0 flex-1 overflow-hidden',
          transparent ? 'bg-transparent' : boardSurface === 'black' ? 'bg-[#111318]' : 'bg-white',
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
