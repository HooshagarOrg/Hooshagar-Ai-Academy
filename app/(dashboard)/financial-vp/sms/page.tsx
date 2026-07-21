import { UnderConstruction } from '@/components/ui/under-construction'

export default function Page() {
  return (
    <UnderConstruction
      title="ارسال SMS مالی"
      description="این مسیر برای کنترل هزینه پیامک در پایلوت غیرفعال است. یادآوری شهریه فعلاً از اعلان داخل برنامه انجام می‌شود."
      backHref="/financial-vp"
      features={['یادآوری بدهی', 'تشکر از پرداخت', 'سقف روزانه مدرسه']}
    />
  )
}
