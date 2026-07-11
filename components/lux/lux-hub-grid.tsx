import Link from 'next/link'
import { ChevronLeft } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { GlassCard } from '@/components/ui/glass-card'
import { cn } from '@/lib/utils'

export type LuxHubCard = {
  title: string
  description: string
  icon: LucideIcon
  href: string
  color?: string
  bg?: string
  featured?: boolean
}

export type LuxHubGroup = {
  title: string
  cards: LuxHubCard[]
}

interface LuxHubGridProps {
  groups: LuxHubGroup[]
  className?: string
}

export function LuxHubGrid({ groups, className }: LuxHubGridProps) {
  return (
    <div className={cn('space-y-8', className)}>
      {groups.map((group) => (
        <section key={group.title}>
          <h2 className="lux-kicker mb-4 text-[var(--lux-text-muted)]">{group.title}</h2>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
            {group.cards.map((card) => {
              const Icon = card.icon
              return (
                <Link key={card.href} href={card.href} className="group block h-full">
                  <GlassCard
                    hover
                    className={cn(
                      'h-full p-5 transition-all duration-200',
                      card.featured && 'lux-dash-tool-featured',
                    )}
                  >
                    <div className="flex items-start gap-3">
                      <div
                        className={cn(
                          'flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl',
                          card.bg ?? 'border border-white/10 bg-white/5',
                        )}
                      >
                        <Icon className={cn('h-5 w-5', card.color ?? 'text-[var(--lux-primary)]')} />
                      </div>
                      <div className="min-w-0 flex-1">
                        <h3 className="mb-1 text-sm font-bold text-[var(--lux-text)] transition-colors group-hover:text-[var(--lux-secondary)]">
                          {card.title}
                        </h3>
                        <p className="text-xs leading-relaxed text-[var(--lux-text-muted)]">
                          {card.description}
                        </p>
                      </div>
                      <ChevronLeft className="mt-1 h-4 w-4 flex-shrink-0 text-[var(--lux-text-muted)] transition-colors group-hover:text-[var(--lux-text)]" />
                    </div>
                  </GlassCard>
                </Link>
              )
            })}
          </div>
        </section>
      ))}
    </div>
  )
}
