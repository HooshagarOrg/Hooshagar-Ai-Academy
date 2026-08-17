'use client'

import { useEffect, useState } from 'react'
import { WhiteboardCanvas } from '@/components/teacher/whiteboard-canvas'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { Loader2 } from 'lucide-react'

type PdfTeachViewerProps = {
  /** مسیر پروکسی same-origin */
  fileUrl: string
  title: string
  className?: string
}

/**
 * PDF را با credentials می‌گیرد، blob می‌سازد، در iframe نشان می‌دهد.
 * لایه نقاشی شفاف روی آن است؛ پیش‌فرض: ورق زدن تا کتاب دیده شود.
 */
export function PdfTeachViewer({ fileUrl, title, className }: PdfTeachViewerProps) {
  const [blobUrl, setBlobUrl] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    let objectUrl: string | null = null

    async function load() {
      setLoading(true)
      setError(null)
      setBlobUrl(null)
      try {
        const res = await fetch(fileUrl, {
          credentials: 'include',
          cache: 'no-store',
        })
        if (!res.ok) {
          let message = 'بارگذاری PDF ناموفق بود'
          try {
            const body = (await res.json()) as { error?: string }
            if (body.error) message = body.error
          } catch {
            /* ignore */
          }
          throw new Error(message)
        }

        const contentType = res.headers.get('content-type') || ''
        const buffer = await res.arrayBuffer()
        if (buffer.byteLength < 5) {
          throw new Error('فایل PDF خالی یا ناقص است')
        }

        const head = new Uint8Array(buffer.slice(0, 5))
        const magic = String.fromCharCode(...head)
        if (!magic.startsWith('%PDF') && !contentType.includes('pdf')) {
          throw new Error('پاسخ سرور PDF معتبر نیست')
        }

        const blob = new Blob([buffer], { type: 'application/pdf' })
        objectUrl = URL.createObjectURL(blob)
        if (cancelled) {
          URL.revokeObjectURL(objectUrl)
          return
        }
        setBlobUrl(objectUrl)
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'خطای ناشناخته')
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    void load()
    return () => {
      cancelled = true
      if (objectUrl) URL.revokeObjectURL(objectUrl)
    }
  }, [fileUrl])

  return (
    <div
      className={cn(
        'relative flex h-[min(78vh,820px)] min-h-[420px] flex-col overflow-hidden rounded-xl border border-border/70 bg-muted/20',
        className
      )}
    >
      {loading && (
        <div className="flex flex-1 items-center justify-center gap-2 text-muted-foreground">
          <Loader2 className="size-5 animate-spin" />
          در حال بارگذاری کتاب…
        </div>
      )}

      {error && !loading && (
        <div className="flex flex-1 flex-col items-center justify-center gap-3 p-6 text-center" dir="rtl">
          <p className="text-sm text-destructive" role="alert">
            {error}
          </p>
          <Button type="button" variant="outline" size="sm" onClick={() => window.location.reload()}>
            تلاش مجدد
          </Button>
        </div>
      )}

      {!loading && !error && blobUrl && (
        <div className="relative min-h-0 flex-1">
          <iframe
            title={title}
            src={`${blobUrl}#toolbar=1&navpanes=0`}
            className="absolute inset-0 h-full w-full border-0 bg-white"
          />
          <WhiteboardCanvas
            transparent
            showBrowseMode
            defaultMode="browse"
            className="absolute inset-0 z-10"
          />
        </div>
      )}
    </div>
  )
}
