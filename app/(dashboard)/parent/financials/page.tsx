import { UnderConstruction } from '@/components/ui/under-construction'
import {
  COMING_SOON_ACCOUNTING,
  COMING_SOON_PILOT_NOTE,
} from '@/lib/copy/coming-soon'

export default function ParentFinancialsPage() {
  return (
    <UnderConstruction
      title="امور مالی"
      description={`${COMING_SOON_ACCOUNTING}. مبالغ شهریه و پرداخت را از واحد مالی مدرسه پیگیری کنید.`}
      backHref="/parent"
      backLabel="بازگشت به داشبورد والد"
      pilotNote={COMING_SOON_PILOT_NOTE}
      features={[
        'مشاهدهٔ شهریه و مانده',
        'تاریخچهٔ پرداخت‌ها',
        'رسید و پیگیری اقساط',
      ]}
    />
  )
}
