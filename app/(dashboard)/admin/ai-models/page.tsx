import { UnderConstruction } from '@/components/ui/under-construction'
import { COMING_SOON_PILOT_NOTE } from '@/lib/copy/coming-soon'

export default function AdminAiModelsPage() {
  return (
    <UnderConstruction
      title="مدل‌های AI"
      description="پیکربندی مدل برای هر قابلیت هنوز به تنظیمات واقعی وصل نشده است. تست مدل از صفحهٔ «تست AI» انجام می‌شود."
      backHref="/admin"
      backLabel="بازگشت به داشبورد ادمین"
      pilotNote={COMING_SOON_PILOT_NOTE}
      features={[
        'انتخاب مدل اصلی و جایگزین برای هر ابزار',
        'مقایسه خروجی مدل‌ها',
        'تاریخچهٔ تغییر تنظیمات',
      ]}
    />
  )
}
