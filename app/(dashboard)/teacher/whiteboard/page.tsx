'use client'

import { DashboardPage } from '@/components/layout/dashboard-page'
import { WhiteboardCanvas } from '@/components/teacher/whiteboard-canvas'

export default function TeacherWhiteboardPage() {
  return (
    <DashboardPage
      title="تخته تدریس"
      description="تخته سفید خالی برای توضیح روی کلاس — بدون ذخیره روی سرور"
    >
      <div className="h-[min(78vh,820px)] min-h-[420px] overflow-hidden rounded-xl border border-border/70">
        <WhiteboardCanvas className="h-full" />
      </div>
    </DashboardPage>
  )
}
