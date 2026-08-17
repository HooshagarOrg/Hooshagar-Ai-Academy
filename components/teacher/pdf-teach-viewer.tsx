'use client'

import { WhiteboardCanvas } from '@/components/teacher/whiteboard-canvas'
import { cn } from '@/lib/utils'

type PdfTeachViewerProps = {
  /** آدرس same-origin (مثلاً پروکسی API) — نه لینک مستقیم آروان */
  fileUrl: string
  title: string
  className?: string
}

/**
 * نمایش PDF با لایه نقاشی موقت روی آن.
 * «ورق زدن» رویدادها را به PDF می‌دهد؛ «قلم» روی canvas می‌کشد.
 */
export function PdfTeachViewer({ fileUrl, title, className }: PdfTeachViewerProps) {
  return (
    <div
      className={cn(
        'relative h-[min(78vh,820px)] min-h-[420px] overflow-hidden rounded-xl border border-border/70 bg-muted/20',
        className
      )}
    >
      <iframe
        title={title}
        src={fileUrl}
        className="absolute inset-0 h-full w-full border-0 bg-white"
      />
      <WhiteboardCanvas
        transparent
        showBrowseMode
        className="absolute inset-0 z-10"
      />
    </div>
  )
}
