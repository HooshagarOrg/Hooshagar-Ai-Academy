import { UnderConstruction } from '@/components/ui/under-construction'
import {
  COMING_SOON_ACCOUNTING,
  COMING_SOON_PILOT_NOTE,
} from '@/lib/copy/coming-soon'

export default function AdminTuitionSettingsPage() {
  return (
    <UnderConstruction
      title="تنظیمات شهریه"
      description={COMING_SOON_ACCOUNTING}
      backHref="/admin"
      backLabel="بازگشت به داشبورد ادمین"
      pilotNote={COMING_SOON_PILOT_NOTE}
      features={[
        'تعرفه شهریه و سرویس',
        'هزینه ثبت‌نام',
        'اتصال به امور مالی والدین پس از راه‌اندازی حسابداری',
      ]}
    />
  )
}
