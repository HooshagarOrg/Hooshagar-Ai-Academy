'use client'

import { WhiteboardCanvas } from '@/components/teacher/whiteboard-canvas'
import { cn } from '@/lib/utils'

type PdfTeachViewerProps = {
  /** مسیر پروکسی same-origin */
  fileUrl: string
  title: string
  className?: string
}

/**
 * PDF را در iframe همان دامنه نشان می‌دهد (CSP اجازه blob نمی‌دهد).
 * لایه نقاشی شفاف است؛ پیش‌فرض: ورق زدن تا کتاب دیده شود.
 */
export function PdfTeachViewer({ fileUrl, title, className }: PdfTeachViewerProps) {
  return (
    <div
      className={cn(
        'relative h-[min(78vh,820px)] min-h-[420px] overflow-hidden rounded-xl border border-border/70 bg-white',
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
        defaultMode="browse"
        className="absolute inset-0 z-10"
      />
    </div>
  )
}
