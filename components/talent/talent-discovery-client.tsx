'use client'

import { useEffect, useMemo, useState } from 'react'
import { LuxPageHeader } from '@/components/lux/lux-page-header'
import { LuxStagger, LuxStaggerItem } from '@/components/lux/lux-motion'
import { TalentGalaxy, type TalentNode } from '@/components/talent/talent-galaxy'
import { TalentRadarPanel } from '@/components/talent/talent-radar'
import { SkillGraphPanel, type SkillBar } from '@/components/talent/skill-graph'
import { GrowthTimelinePanel } from '@/components/talent/growth-timeline'
import { AiInterpretationPanel } from '@/components/talent/ai-interpretation'
import XPCard from '@/components/XPCard'

const DEFAULT_NODES: TalentNode[] = [
  { id: 'math', label: 'ریاضی', score: 82, category: 'academic', related: ['logic'] },
  { id: 'logic', label: 'تحلیل', score: 78, category: 'tech', related: ['math', 'science'] },
  { id: 'science', label: 'علوم', score: 74, category: 'academic', related: ['logic'] },
  { id: 'art', label: 'خلاقیت', score: 68, category: 'art', related: ['social'] },
  { id: 'sport', label: 'ورزش', score: 55, category: 'sport' },
  { id: 'social', label: 'ارتباط', score: 71, category: 'social', related: ['art'] },
]

export function TalentDiscoveryClient() {
  const [level, setLevel] = useState(1)
  const [xp, setXp] = useState(0)

  useEffect(() => {
    fetch('/api/xp/balance')
      .then((r) => r.json())
      .then((d) => {
        if (!d.error) {
          setLevel(d.level ?? 1)
          setXp(d.xp ?? 0)
        }
      })
      .catch(() => {})
  }, [])

  const radarValues = useMemo(
    () => [72 + level * 2, 60 + level, 50 + level, 65 + level, 68 + level * 2].map((v) => Math.min(95, v)),
    [level],
  )

  const skills: SkillBar[] = useMemo(
    () =>
      DEFAULT_NODES.map((n) => ({
        id: n.id,
        label: n.label,
        score: n.score + Math.min(10, level),
        category: n.category,
      })),
    [level],
  )

  const interpretation = useMemo(() => {
    if (xp > 500) {
      return 'الگوی یادگیری تو ترکیبی از تحلیل قوی و خلاقیت فعال است. نقاط درسی و فناوری بالاترین پتانسیل رشد را دارند.'
    }
    return 'هنوز در ابتدای کشف استعداد هستی — با تمرین منظم و گفتگو با هوشیار، تصویر دقیق‌تری از توانایی‌هایت به‌دست می‌آوری.'
  }, [xp])

  return (
    <div className="min-h-full bg-[var(--lux-void)] -m-4 sm:-m-5 md:-m-6 lg:-m-8 p-4 sm:p-5 md:p-6 lg:p-8" dir="rtl">
      <LuxPageHeader
        kicker="کشف استعداد"
        title="کهکشان استعداد"
        subtitle="هر استعداد یک ستاره است — روابط، رشد و تفسیر AI در یک نگاه."
      />

      <TalentGalaxy nodes={DEFAULT_NODES} radarValues={radarValues} />

      <LuxStagger className="mt-6 grid gap-5 lg:grid-cols-2" stagger={0.2}>
        <LuxStaggerItem>
          <TalentRadarPanel current={radarValues} potential={radarValues.map((v) => Math.min(100, v + 10))} />
        </LuxStaggerItem>
        <LuxStaggerItem>
          <SkillGraphPanel skills={skills} />
        </LuxStaggerItem>
        <LuxStaggerItem>
          <GrowthTimelinePanel />
        </LuxStaggerItem>
        <LuxStaggerItem>
          <AiInterpretationPanel fallback={interpretation} />
        </LuxStaggerItem>
      </LuxStagger>

      <div className="mt-6">
        <XPCard />
      </div>
    </div>
  )
}
