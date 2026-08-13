import { UnderConstruction } from '@/components/ui/under-construction'
import {
  COMING_SOON_LICENSE_VIRTUAL_CLASS,
  COMING_SOON_PILOT_NOTE,
} from '@/lib/copy/coming-soon'

export default function ParentVirtualClassPage() {
  return (
    <UnderConstruction
      title="کلاس مجازی"
      description={COMING_SOON_LICENSE_VIRTUAL_CLASS}
      backHref="/parent"
      backLabel="بازگشت به داشبورد والد"
      pilotNote={COMING_SOON_PILOT_NOTE}
      features={[
        'ورود به جلسهٔ آنلاین کلاس فرزند',
        'برنامهٔ جلسات',
        'پس از خرید لایسنس کلاس مجازی فعال می‌شود',
      ]}
    />
  )
}
