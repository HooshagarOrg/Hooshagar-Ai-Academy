'use client'

import { DashboardPage } from '@/components/layout/dashboard-page'
import { LearnerAssignments } from '@/components/class-files/learner-assignments'

export default function StudentAssignmentsPage() {
  return (
    <DashboardPage
      title="تکالیف"
      description="صورت‌مسئله را ببینید، فایل بفرستید و نمره را اینجا بخوانید. فرمت: تصویر، PDF، ورد یا کلیپ کوتاه؛ سند تا ۲۰ مگ و کلیپ تا ۵۰ مگ."
    >
      <LearnerAssignments role="student" />
    </DashboardPage>
  )
}
