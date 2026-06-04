'use client'

import { cn } from '@/lib/utils'
import type { UiTone } from '@/lib/ui/role-tone'

interface AmbientBackgroundProps {
  className?: string
  tone?: UiTone
}

export function AmbientBackground({ className, tone = 'balanced' }: AmbientBackgroundProps) {
  const isCalm = tone === 'calm'
  const isVivid = tone === 'vivid'

  return (
    <div
      className={cn('pointer-events-none fixed inset-0 overflow-hidden -z-10', className)}
      aria-hidden
    >
      <div
        className={cn(
          'ambient-blob top-[-10%] right-[-5%] w-[380px] h-[380px] bg-brand-pink/20',
          isVivid && 'opacity-90 bg-brand-pink/25',
          isCalm && 'opacity-25 bg-brand-pink/10',
          !isVivid && !isCalm && 'opacity-50',
        )}
      />
      <div
        className={cn(
          'ambient-blob bottom-[-12%] left-[-6%] w-[320px] h-[320px] bg-brand-cyan/15',
          isVivid && 'opacity-80',
          isCalm && 'opacity-20',
          !isVivid && !isCalm && 'opacity-45',
        )}
        style={{ animationDelay: '-5s' }}
      />
      {!isCalm && (
        <div
          className={cn(
            'ambient-blob top-[45%] left-[35%] w-[220px] h-[220px] bg-brand-purple/12',
            isVivid ? 'opacity-70' : 'opacity-40',
          )}
          style={{ animationDelay: '-9s' }}
        />
      )}
      {isVivid && (
        <div
          className="ambient-blob bottom-[18%] right-[20%] w-[160px] h-[160px] bg-brand-orange/10 opacity-60"
          style={{ animationDelay: '-3s' }}
        />
      )}
    </div>
  )
}
