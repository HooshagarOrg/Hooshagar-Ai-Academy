'use client'

import { cn } from '@/lib/utils'
import {
  KNOWLEDGE_UNIVERSE_SYMBOLS,
  depthStyle,
  isPersianSymbol,
} from '@/lib/knowledge-universe/layers'
import type { UiTone } from '@/lib/ui/role-tone'

interface KnowledgeUniverseBgProps {
  className?: string
  tone?: UiTone
}

/**
 * Hooshagar Knowledge Universe — پس‌زمینهٔ آکادمیک ثابت
 * بدون shader، بدون انیمیشن، لایه‌های عمق با نمادهای علمی/فارسی
 */
export function KnowledgeUniverseBg({ className, tone = 'balanced' }: KnowledgeUniverseBgProps) {
  const vivid = tone === 'vivid'
  const calm = tone === 'calm'

  return (
    <div
      className={cn('pointer-events-none fixed inset-0 -z-10 overflow-hidden ku-universe', className)}
      aria-hidden
    >
      <div className="absolute inset-0 bg-background" />

      {/* Central AI aura — ثابت */}
      <div
        className={cn(
          'absolute left-1/2 top-[42%] -translate-x-1/2 -translate-y-1/2 rounded-full ku-aura',
          vivid && 'ku-aura-vivid',
          calm && 'ku-aura-calm',
        )}
      />

      {/* Depth haze */}
      <div className="absolute inset-0 ku-depth-fog" />

      {/* Knowledge grid */}
      <div className="absolute inset-0 ku-grid" />

      {/* Symbol field — ثابت، بدون حرکت */}
      <div className="absolute inset-0">
        {KNOWLEDGE_UNIVERSE_SYMBOLS.map((item) => {
          const { scale, opacity, blur } = depthStyle(item.depth)
          const persian = isPersianSymbol(item.symbol)
          return (
            <span
              key={item.id}
              className={cn(
                'absolute select-none whitespace-nowrap ku-symbol',
                item.outlined && 'ku-symbol-outline',
                persian ? 'font-sans' : 'font-mono-en',
                item.category === 'knowledge' && 'ku-symbol-near',
              )}
              style={{
                left: `${item.x}%`,
                top: `${item.y}%`,
                transform: `translate(-50%, -50%) rotate(${item.rotate ?? 0}deg) scale(${scale})`,
                opacity,
                filter: blur > 0.3 ? `blur(${blur}px)` : undefined,
              }}
            >
              {item.symbol}
            </span>
          )
        })}
      </div>

      <div className="absolute inset-0 ku-vignette" />
    </div>
  )
}
