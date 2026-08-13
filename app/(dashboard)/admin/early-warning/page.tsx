import { UnderConstruction } from '@/components/ui/under-construction'
import { COMING_SOON_PILOT_NOTE } from '@/lib/copy/coming-soon'

export default function AdminEarlyWarningPage() {
  return (
    <UnderConstruction
      title="هشدار زودهنگام"
      description="شناسایی دانش‌آموزان در معرض ریسک هنوز به نمرات و حضور واقعی مدرسه وصل نشده است."
      backHref="/admin"
      backLabel="بازگشت به داشبورد ادمین"
      pilotNote={COMING_SOON_PILOT_NOTE}
      features={[
        'هشدار افت تحصیلی و غیبت',
        'پیشنهاد اقدام به مشاور و معلم',
        'پیگیری وضعیت پس از مداخله',
      ]}
    />
  )
}
