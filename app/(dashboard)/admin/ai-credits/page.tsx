import { UnderConstruction } from '@/components/ui/under-construction'
import { COMING_SOON_PILOT_NOTE } from '@/lib/copy/coming-soon'

export default function AdminAiCreditsPage() {
  return (
    <UnderConstruction
      title="اعتبار AI"
      description="مدیریت اعتبار خریداری‌شده هنوز به سامانهٔ صورتحساب وصل نشده است. سقف استفاده را از «محدودیت‌های AI» تنظیم کنید."
      backHref="/admin"
      backLabel="بازگشت به داشبورد ادمین"
      pilotNote={COMING_SOON_PILOT_NOTE}
      features={[
        'اعتبار هر مدرسه',
        'گزارش مصرف به تفکیک ابزار',
        'شارژ و هشدار اتمام اعتبار',
      ]}
    />
  )
}
