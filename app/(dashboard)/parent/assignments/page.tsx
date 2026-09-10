'use client'

import { DashboardPage } from '@/components/layout/dashboard-page'
import { LearnerAssignments } from '@/components/class-files/learner-assignments'

export default function ParentAssignmentsPage() {
  return (
    <DashboardPage
      title="تکالیف فرزند"
      description="می‌توانید به نیابت فرزند فایل بفرستید و نمره را ببینید. فرمت: تصویر، PDF، ورد یا کلیپ کوتاه؛ سند تا ۲۰ مگ و کلیپ تا ۵۰ مگ."
    >
      <LearnerAssignments role="parent" />
    </DashboardPage>
  )
}
