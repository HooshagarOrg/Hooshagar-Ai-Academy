'use client'

import { motion, useReducedMotion } from 'framer-motion'
import { cn } from '@/lib/utils'
import {
  KNOWLEDGE_UNIVERSE_SYMBOLS,
  depthStyle,
  isPersianSymbol,
} from '@/lib/knowledge-universe/layers'

function symbolDelay(id: string) {
  let h = 0
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) % 1000
  return (h % 40) / 10
}

function symbolDuration(id: string) {
  let h = 0
  for (let i = 0; i < id.length; i++) h = (h * 17 + id.charCodeAt(i)) % 1000
  return 5 + (h % 50) / 10
}

interface KnowledgeSymbolsLayerProps {
  className?: string
  /** landing = پررنگ‌تر، auth = ملایم‌تر */
  intensity?: 'landing' | 'auth'
  animate?: boolean
}

export function KnowledgeSymbolsLayer({
  className,
  intensity = 'landing',
  animate = true,
}: KnowledgeSymbolsLayerProps) {
  const reduce = useReducedMotion()
  const shouldAnimate = animate && !reduce
  const auth = intensity === 'auth'

  return (
    <div className={cn('absolute inset-0', className)} aria-hidden>
      {KNOWLEDGE_UNIVERSE_SYMBOLS.map((item) => {
        const { scale, opacity, blur } = depthStyle(item.depth)
        const persian = isPersianSymbol(item.symbol)
        const baseOpacity = opacity * (auth ? 0.55 : 0.92)
        const drift = auth ? 5 : 12

        const style = {
          left: `${item.x}%`,
          top: `${item.y}%`,
          filter: blur > 0.3 ? `blur(${blur}px)` : undefined,
        }

        const classNames = cn(
          'absolute select-none whitespace-nowrap ku-symbol',
          shouldAnimate && 'ku-symbol-float',
          item.outlined && 'ku-symbol-outline',
          persian ? 'font-sans' : 'font-mono-en',
          item.category === 'knowledge' && 'ku-symbol-near',
        )

        if (!shouldAnimate) {
          return (
            <span
              key={item.id}
              className={classNames}
              style={{
                ...style,
                transform: `translate(-50%, -50%) rotate(${item.rotate ?? 0}deg) scale(${scale})`,
                opacity: baseOpacity,
              }}
            >
              {item.symbol}
            </span>
          )
        }

        return (
          <motion.span
            key={item.id}
            className={classNames}
            style={style}
            initial={{
              x: '-50%',
              y: '-50%',
              rotate: item.rotate ?? 0,
              scale,
              opacity: baseOpacity * 0.85,
            }}
            animate={{
              y: ['-50%', `calc(-50% - ${drift}px)`, '-50%'],
              opacity: [baseOpacity * 0.75, baseOpacity, baseOpacity * 0.8],
            }}
            transition={{
              duration: symbolDuration(item.id),
              repeat: Infinity,
              ease: 'easeInOut',
              delay: symbolDelay(item.id),
            }}
          >
            {item.symbol}
          </motion.span>
        )
      })}
    </div>
  )
}
