'use client'

import { UnderConstruction } from '@/components/ui/under-construction'

/**
 * امور مالی والدین — تا اتصال سامانهٔ واقعی از منو مخفی است.
 * مسیر مستقیم فقط صفحهٔ «به‌زودی» نشان می‌دهد (بدون مبالغ نمونه).
 */
export default function ParentFinancialsPage() {
  return (
    <UnderConstruction
      title="امور مالی"
      description="سامانهٔ مالی واقعی هنوز متصل نشده است. مبالغ شهریه و پرداخت را از واحد مالی مدرسه پیگیری کنید."
      backHref="/parent"
      backLabel="بازگشت به داشبورد والد"
      pilotNote="پایلوت — به‌زودی"
      features={[
        'مشاهدهٔ شهریه و مانده',
        'تاریخچهٔ پرداخت‌ها',
        'رسید و پیگیری اقساط',
      ]}
    />
  )
}
