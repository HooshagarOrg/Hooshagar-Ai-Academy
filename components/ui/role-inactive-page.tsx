import { UnderConstruction } from '@/components/ui/under-construction'
import {
  COMING_SOON_PILOT_NOTE,
  COMING_SOON_ROLE_INACTIVE,
} from '@/lib/copy/coming-soon'

export function RoleInactivePage({
  title,
  backHref,
}: {
  title: string
  backHref: string
}) {
  return (
    <UnderConstruction
      title={title}
      description={COMING_SOON_ROLE_INACTIVE}
      backHref={backHref}
      backLabel="بازگشت"
      pilotNote={COMING_SOON_PILOT_NOTE}
    />
  )
}
