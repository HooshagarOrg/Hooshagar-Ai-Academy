import { UnderConstruction } from '@/components/ui/under-construction'
import { COMING_SOON_PILOT_NOTE } from '@/lib/copy/coming-soon'

export default function TeacherAwardBadgesPage() {
  return (
    <UnderConstruction
      title="اعطای نشان"
      description="اعطای دستی نشان به دانش‌آموزان از این صفحه هنوز به سامانهٔ نشان‌ها وصل نشده است."
      backHref="/teacher"
      backLabel="بازگشت به داشبورد معلم"
      pilotNote={COMING_SOON_PILOT_NOTE}
      features={[
        'انتخاب دانش‌آموز کلاس',
        'اعطای نشان با دلیل',
        'اطلاع به والدین پس از اتصال واقعی',
      ]}
    />
  )
}
