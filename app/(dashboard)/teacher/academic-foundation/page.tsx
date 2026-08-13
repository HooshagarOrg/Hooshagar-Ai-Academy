import { UnderConstruction } from '@/components/ui/under-construction'
import { COMING_SOON_PILOT_NOTE } from '@/lib/copy/coming-soon'

export default function AcademicFoundationPage() {
  return (
    <UnderConstruction
      title="ارزیابی مهارت‌های پایه"
      description="ثبت ارزیابی مهارت‌های زبانی، ریاضی و شناختی هنوز به پایگاه داده وصل نشده است."
      backHref="/teacher"
      backLabel="بازگشت به داشبورد معلم"
      pilotNote={COMING_SOON_PILOT_NOTE}
      features={[
        'ثبت مهارت‌های زبانی و ریاضی',
        'نمودار پیشرفت دانش‌آموز',
        'پیشنهاد آموزشی بر اساس ارزیابی',
      ]}
    />
  )
}
