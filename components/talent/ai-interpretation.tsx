'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { LuxCard } from '@/components/lux/lux-card'
import { HooshiarCharacter } from '@/components/avatar/hooshiar-character'

interface AiInterpretationPanelProps {
  fallback: string
}

export function AiInterpretationPanel({ fallback }: AiInterpretationPanelProps) {
  const [text, setText] = useState(fallback)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/avatar/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: 'یک پاراگراف کوتاه فارسی درباره نقاط قوت و مسیر رشد استعداد دانش‌آموز بنویس. لحن دوستانه و الهام‌بخش.',
      }),
    })
      .then((r) => r.json())
      .then((d) => {
        if (d.reply) setText(d.reply)
        else if (d.answer) setText(d.answer)
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [fallback])

  return (
    <LuxCard gradientBorder className="relative overflow-hidden">
      <div className="flex items-start gap-3">
        <HooshiarCharacter mood={loading ? 'thinking' : 'happy'} size="md" />
        <div className="min-w-0 flex-1">
          <p className="text-xs font-bold text-[var(--lux-accent)]">تفسیر هوشیار</p>
          <h3 className="mt-1 font-black text-[var(--lux-text)]">تحلیل استعداد</h3>
          {loading ? (
            <div className="mt-3 space-y-2">
              <div className="h-3 w-full animate-pulse rounded bg-[var(--lux-surface)]" />
              <div className="h-3 w-4/5 animate-pulse rounded bg-[var(--lux-surface)]" />
            </div>
          ) : (
            <p className="mt-3 text-sm leading-8 text-[var(--lux-text-muted)]">{text}</p>
          )}
          <Link href="/student/study-buddy" className="lux-btn-accent mt-4 inline-flex min-h-9 px-4 text-xs">
            مشاوره بیشتر
          </Link>
        </div>
      </div>
    </LuxCard>
  )
}
