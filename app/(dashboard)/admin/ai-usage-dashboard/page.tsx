import { UnderConstruction } from '@/components/ui/under-construction'
import { COMING_SOON_PILOT_NOTE } from '@/lib/copy/coming-soon'

export default function AdminAiUsageDashboardPage() {
  return (
    <UnderConstruction
      title="مصرف هوش مصنوعی"
      description="آمار مصرف هنوز به لاگ واقعی درخواست‌ها وصل نیست و عدد نمونه نشان داده نمی‌شود."
      backHref="/admin"
      backLabel="بازگشت به داشبورد ادمین"
      pilotNote={COMING_SOON_PILOT_NOTE}
      features={[
        'مصرف روزانه و ماهانه',
        'رتبه‌بندی کاربران',
        'گزارش مسدود شدن سهمیه',
      ]}
    />
  )
}
