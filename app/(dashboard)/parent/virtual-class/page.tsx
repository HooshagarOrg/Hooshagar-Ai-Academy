import { DashboardPage } from '@/components/layout/dashboard-page'
import { VirtualClassCard } from '@/components/virtual-class/virtual-class-card'

export default function ParentVirtualClassPage() {
  return (
    <DashboardPage
      title="کلاس مجازی"
      description="ورود به جلسهٔ آنلاین کلاس فرزند — بدون نام کاربری و رمز اسکای‌روم"
    >
      <VirtualClassCard showEmpty />
    </DashboardPage>
  )
}
