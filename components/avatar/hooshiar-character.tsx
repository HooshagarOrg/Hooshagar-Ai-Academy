'use client'

import { cn } from '@/lib/utils'

export type HooshiarMood = 'idle' | 'thinking' | 'talking' | 'happy'

interface HooshiarCharacterProps {
  mood?: HooshiarMood
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

const sizes = {
  sm: 'h-12 w-12',
  md: 'h-16 w-16',
  lg: 'h-24 w-24',
}

/**
 * کاراکتر ساده هوشیار — جغد دانش کوچک (SVG)
 */
export function HooshiarCharacter({
  mood = 'idle',
  size = 'md',
  className,
}: HooshiarCharacterProps) {
  return (
    <div
      className={cn(
        'relative flex items-center justify-center',
        sizes[size],
        mood === 'thinking' && 'animate-pulse',
        mood === 'talking' && 'animate-bounce',
        mood === 'happy' && 'scale-105 transition-transform',
        className
      )}
      aria-hidden
    >
      <svg
        viewBox="0 0 64 64"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="h-full w-full drop-shadow-lg"
      >
        <defs>
          <linearGradient id="hooshi-body" x1="8" y1="8" x2="56" y2="56">
            <stop offset="0%" stopColor="#8B7CFF" />
            <stop offset="100%" stopColor="#54D2FF" />
          </linearGradient>
          <linearGradient id="hooshi-belly" x1="20" y1="36" x2="44" y2="52">
            <stop offset="0%" stopColor="#C9A962" />
            <stop offset="100%" stopColor="#DFC98A" />
          </linearGradient>
        </defs>
        {/* بدن */}
        <ellipse cx="32" cy="38" rx="22" ry="20" fill="url(#hooshi-body)" />
        <ellipse cx="32" cy="42" rx="12" ry="10" fill="url(#hooshi-belly)" opacity="0.9" />
        {/* گوش‌ها */}
        <path d="M14 22 L8 8 L22 18 Z" fill="#6B5CE7" />
        <path d="M50 22 L56 8 L42 18 Z" fill="#6B5CE7" />
        {/* چشم‌ها */}
        <circle cx="24" cy="32" r="5" fill="#0c1018" />
        <circle cx="40" cy="32" r="5" fill="#0c1018" />
        <circle cx="25" cy="31" r="1.5" fill="#f1f5f9" />
        <circle cx="41" cy="31" r="1.5" fill="#f1f5f9" />
        {/* منقار */}
        <path d="M28 38 L32 42 L36 38 Z" fill="#FF9B54" />
        {/* دهان هنگام صحبت */}
        {mood === 'talking' && (
          <ellipse cx="32" cy="44" rx="4" ry="2" fill="#0c1018" opacity="0.6" />
        )}
        {mood === 'happy' && (
          <path
            d="M26 44 Q32 48 38 44"
            stroke="#0c1018"
            strokeWidth="1.5"
            fill="none"
            strokeLinecap="round"
          />
        )}
        {/* ستاره دانش */}
        <path
          d="M32 6 L33.5 10 L38 10 L34.5 12.5 L36 17 L32 14.5 L28 17 L29.5 12.5 L26 10 L30.5 10 Z"
          fill="#FFD166"
          className={cn(mood === 'happy' && 'animate-pulse')}
        />
      </svg>
    </div>
  )
}
