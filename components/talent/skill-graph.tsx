'use client'

import { LuxCard } from '@/components/lux/lux-card'

export type TalentCategory = 'academic' | 'art' | 'sport' | 'social' | 'tech'

const CATEGORY_COLOR: Record<TalentCategory, string> = {
  academic: 'var(--lux-primary)',
  art: 'var(--lux-accent)',
  sport: 'var(--lux-success)',
  social: 'var(--lux-secondary)',
  tech: 'var(--lux-gold)',
}

const CATEGORY_LABEL: Record<TalentCategory, string> = {
  academic: 'درسی',
  art: 'هنری',
  sport: 'ورزشی',
  social: 'اجتماعی',
  tech: 'فناوری',
}

export interface SkillBar {
  id: string
  label: string
  score: number
  category: TalentCategory
}

export function SkillGraphPanel({ skills }: { skills: SkillBar[] }) {
  const sorted = [...skills].sort((a, b) => b.score - a.score)

  return (
    <LuxCard>
      <p className="lux-kicker mb-1">نقشه مهارت</p>
      <h3 className="mb-4 font-black text-[var(--lux-text)]">مرتب‌شده بر اساس قوت</h3>
      <div className="space-y-3">
        {sorted.map((s) => (
          <div key={s.id}>
            <div className="mb-1 flex justify-between text-xs font-bold">
              <span className="text-[var(--lux-text)]">{s.label}</span>
              <span style={{ color: CATEGORY_COLOR[s.category] }}>
                {s.score.toLocaleString('fa-IR')}٪ · {CATEGORY_LABEL[s.category]}
              </span>
            </div>
            <div className="h-2.5 overflow-hidden rounded-full bg-[var(--lux-surface)]">
              <div
                className="h-full rounded-full transition-all duration-700"
                style={{ width: `${s.score}%`, background: CATEGORY_COLOR[s.category] }}
              />
            </div>
          </div>
        ))}
      </div>
    </LuxCard>
  )
}

export { CATEGORY_COLOR, CATEGORY_LABEL }
