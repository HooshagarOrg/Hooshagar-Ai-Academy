import { DashboardPage } from '@/components/layout/dashboard-page'
import { EmptyState } from '@/components/ui/empty-state'

export default function EducationalVpActivitiesMovedPage() {
  return (
    <DashboardPage kicker="معاون آموزشی" title="فعالیت‌ها">
      <EmptyState
        title="این بخش مال معاون پرورشی است"
        description="فعالیت‌های پرورشی از نقش معاون آموزشی جدا شد. برای برنامهٔ درسی از «برنامه‌ریزی» استفاده کنید."
      />
    </DashboardPage>
  )
}
