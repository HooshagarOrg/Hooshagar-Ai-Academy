'use client'

import { Component, Suspense, useEffect, useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import dynamic from 'next/dynamic'
import { motion, useReducedMotion } from 'framer-motion'
import { LuxCard } from '@/components/lux/lux-card'
import { TalentRadarFallback } from '@/components/talent/talent-radar'
import type { TalentCategory } from '@/components/talent/skill-graph'
import { CATEGORY_COLOR } from '@/components/talent/skill-graph'

export interface TalentNode {
  id: string
  label: string
  score: number
  category: TalentCategory
  related?: string[]
}

const GalaxyScene = dynamic(
  async () => {
    try {
      const mod = await import('./talent-galaxy-scene')
      return mod.TalentGalaxyScene
    } catch {
      // R3F v9 نیاز به React 19 دارد — تا نسخه سازگار نصب شود radar نشان می‌دهیم
      return function GalaxyUnsupported({ nodes }: { nodes: TalentNode[]; onSelect: (n: TalentNode) => void }) {
        const vals = nodes.length ? nodes.map((n) => n.score) : [60, 55, 70, 65, 58]
        return <TalentRadarFallback values={vals.slice(0, 5)} />
      }
    }
  },
  {
    ssr: false,
    loading: () => <div className="h-[60vh] min-h-[320px] animate-pulse rounded-2xl bg-[var(--lux-surface)]" />,
  },
)

class R3FErrorBoundary extends Component<{ children: ReactNode }, { error: Error | null }> {
  constructor(props: { children: ReactNode }) {
    super(props)
    this.state = { error: null }
  }
  static getDerivedStateFromError(e: Error) {
    return { error: e }
  }
  render() {
    if (this.state.error) {
      return (
        <div className="flex h-[60vh] min-h-[320px] items-center justify-center rounded-2xl bg-[var(--lux-surface)] p-6 text-center text-sm text-[var(--lux-text-muted)]">
          نمایش سه‌بعدی در این مرورگر پشتیبانی نمی‌شود
        </div>
      )
    }
    return this.props.children
  }
}

function useIsMobile() {
  const [mobile, setMobile] = useState(false)
  useEffect(() => {
    const mq = window.matchMedia('(max-width: 768px)')
    const update = () => setMobile(mq.matches)
    update()
    mq.addEventListener('change', update)
    return () => mq.removeEventListener('change', update)
  }, [])
  return mobile
}

interface TalentGalaxyProps {
  nodes: TalentNode[]
  radarValues: number[]
}

export function TalentGalaxy({ nodes, radarValues }: TalentGalaxyProps) {
  const mobile = useIsMobile()
  const reduce = useReducedMotion()
  const [selected, setSelected] = useState<TalentNode | null>(null)

  const values = useMemo(() => radarValues, [radarValues])

  return (
    <motion.div
      initial={reduce ? false : { opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
      className="relative overflow-hidden rounded-2xl border border-[var(--lux-surface)] bg-[var(--lux-void)]"
    >
      {mobile ? (
        <div className="flex min-h-[320px] items-center justify-center p-6">
          <TalentRadarFallback values={values} />
        </div>
      ) : (
        <R3FErrorBoundary>
          <Suspense fallback={<div className="h-[60vh] min-h-[320px] animate-pulse bg-[var(--lux-surface)]" />}>
            <GalaxyScene nodes={nodes} onSelect={setSelected} />
          </Suspense>
        </R3FErrorBoundary>
      )}

      {selected && (
        <LuxCard className="absolute bottom-4 left-4 right-4 z-10 border-[var(--lux-primary)]/30 bg-[var(--lux-glass)]">
          <p className="font-black text-[var(--lux-text)]">{selected.label}</p>
          <p className="text-sm text-[var(--lux-text-muted)]">
            امتیاز: {selected.score.toLocaleString('fa-IR')}٪ · رنگ{' '}
            <span style={{ color: CATEGORY_COLOR[selected.category] }}>{selected.category}</span>
          </p>
        </LuxCard>
      )}
    </motion.div>
  )
}
