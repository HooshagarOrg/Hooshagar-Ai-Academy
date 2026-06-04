import Link from 'next/link'
import { cn } from '@/lib/utils'
import { GlassCard } from '@/components/ui/glass-card'
import { ChevronLeft } from 'lucide-react'

interface ToolTileProps {
  href: string
  label: string
  description: string
  icon: React.ReactNode
  featured?: boolean
  accent?: 'pink' | 'cyan' | 'purple' | 'orange' | 'green'
}

const accentMap = {
  pink: 'border-brand-pink/25 bg-brand-pink/10 text-brand-pink',
  cyan: 'border-brand-cyan/25 bg-brand-cyan/10 text-brand-cyan',
  purple: 'border-brand-purple/25 bg-brand-purple/10 text-brand-purple',
  orange: 'border-brand-orange/25 bg-brand-orange/10 text-brand-orange',
  green: 'border-brand-green/25 bg-brand-green/10 text-brand-green',
}

export function ToolTile({
  href,
  label,
  description,
  icon,
  featured = false,
  accent = 'pink',
}: ToolTileProps) {
  if (featured) {
    return (
      <Link href={href} className="block cursor-pointer md:col-span-2 lg:col-span-1">
        <GlassCard
          hover
          className="h-full p-5 border-brand-pink/20 bg-gradient-to-bl from-brand-pink/15 via-card/90 to-brand-purple/10"
        >
          <div className="flex items-start justify-between gap-3">
            <div className={cn('p-3 rounded-2xl border', accentMap[accent])}>{icon}</div>
            <ChevronLeft className="w-5 h-5 text-muted-foreground" />
          </div>
          <p className="font-bold text-lg mt-4">{label}</p>
          <p className="text-sm text-muted-foreground mt-1">{description}</p>
          <span className="inline-block mt-3 text-xs font-medium text-brand-pink">
            شروع کن ←
          </span>
        </GlassCard>
      </Link>
    )
  }

  return (
    <Link href={href} className="block cursor-pointer">
      <GlassCard hover className="h-full p-4 flex flex-col gap-3">
        <div className={cn('w-10 h-10 rounded-xl border flex items-center justify-center', accentMap[accent])}>
          {icon}
        </div>
        <div>
          <p className="font-semibold text-sm">{label}</p>
          <p className="text-[11px] text-muted-foreground mt-0.5 line-clamp-2">{description}</p>
        </div>
      </GlassCard>
    </Link>
  )
}
