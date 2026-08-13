import { UnderConstruction } from '@/components/ui/under-construction'
import { COMING_SOON_PILOT_NOTE } from '@/lib/copy/coming-soon'

export default function Page() {
  return (
    <UnderConstruction
      title="قطب‌نمای آینده"
      description="این بخش هنوز به دادهٔ واقعی وصل نیست و به‌زودی فعال می‌شود."
      backHref="/student"
      backLabel="بازگشت به داشبورد دانش‌آموز"
      pilotNote={COMING_SOON_PILOT_NOTE}
    />
  )
}
