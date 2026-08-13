import { UnderConstruction } from '@/components/ui/under-construction'
import { COMING_SOON_PILOT_NOTE } from '@/lib/copy/coming-soon'

export default function AdminFeaturesManagementPage() {
  return (
    <UnderConstruction
      title="مدیریت قابلیت‌ها"
      description="فعال و غیرفعال کردن قابلیت‌ها برای هر مدرسه هنوز به تنظیمات واقعی وصل نشده است. دسترسی AI را از «کنترل دسترسی» مدیریت کنید."
      backHref="/admin"
      backLabel="بازگشت به داشبورد ادمین"
      pilotNote={COMING_SOON_PILOT_NOTE}
      features={[
        'روشن/خاموش کردن ابزارها برای مدرسه',
        'دسترسی بر اساس نقش',
        'آمار استفاده از هر قابلیت',
      ]}
    />
  )
}
