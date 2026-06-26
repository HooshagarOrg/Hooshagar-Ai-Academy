'use client'

import { motion, useReducedMotion } from 'framer-motion'
import { CheckCircle2, Rocket, BookOpen, FlaskConical, Trophy, Brain } from 'lucide-react'
import { cn } from '@/lib/utils'

const ISLANDS = [
  { id: 'math',     label: 'ریاضی',      color: '#8B7CFF', icon: Brain,          done: true,  x: 0,   z: 0 },
  { id: 'science',  label: 'علوم',       color: '#54D2FF', icon: FlaskConical,   done: true,  x: 22,  z: -20 },
  { id: 'physics',  label: 'فیزیک',      color: '#FF4DA6', icon: Rocket,         active: true, x: 44,  z: -8 },
  { id: 'lit',      label: 'ادبیات',     color: '#39D98A', icon: BookOpen,       done: false, x: 66,  z: -24 },
  { id: 'talent',   label: 'استعداد',    color: '#FFD166', icon: Trophy,         done: false, x: 88,  z: -12 },
]

interface LearningPath3DProps {
  className?: string
}

/**
 * LearningPath3D — مسیر یادگیری isometric با CSS 3D (مثل mockup)
 */
export function LearningPath3D({ className }: LearningPath3DProps) {
  const reduce = useReducedMotion()

  return (
    <div
      className={cn('relative w-full overflow-hidden', className)}
      style={{ perspective: 900 }}
    >
      <div
        className="relative h-[280px] sm:h-[320px] mx-auto max-w-4xl"
        style={{ transformStyle: 'preserve-3d', transform: 'rotateX(52deg) rotateZ(-2deg)' }}
      >
        {/* مسیر اتصال */}
        <svg
          className="absolute inset-0 w-full h-full pointer-events-none"
          viewBox="0 0 800 200"
          preserveAspectRatio="none"
          aria-hidden
        >
          <path
            d="M 40 120 Q 200 80, 400 100 T 760 90"
            fill="none"
            stroke="url(#pathGrad)"
            strokeWidth="4"
            strokeDasharray="8 6"
            opacity="0.5"
          />
          <defs>
            <linearGradient id="pathGrad" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#3B82F6" />
              <stop offset="50%" stopColor="#10B981" />
              <stop offset="100%" stopColor="#EC4899" />
            </linearGradient>
          </defs>
        </svg>

        {ISLANDS.map((island, i) => {
          const Icon = island.icon
          return (
            <motion.div
              key={island.id}
              className="absolute"
              style={{
                left: `${island.x}%`,
                top: '38%',
                transform: `translateZ(${island.z}px)`,
              }}
              initial={reduce ? false : { opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.12, duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
            >
              {/* جزیره */}
              <div
                className="relative flex flex-col items-center"
                style={{ transform: 'rotateX(-52deg)' }}
              >
                <div
                  className={cn(
                    'w-20 h-20 sm:w-24 sm:h-24 rounded-2xl flex items-center justify-center relative',
                  )}
                  style={{
                    background: `linear-gradient(145deg, ${island.color}33, ${island.color}12)`,
                    border: `1.5px solid ${island.color}55`,
                    boxShadow: island.active
                      ? `0 20px 50px ${island.color}40, 0 0 30px ${island.color}30, 0 0 0 2px ${island.color}`
                      : `0 12px 32px rgba(0,0,0,0.4)`,
                  }}
                >
                  <Icon className="w-8 h-8 sm:w-10 sm:h-10" style={{ color: island.color }} />
                  {island.done && (
                    <CheckCircle2
                      className="absolute -top-2 -right-2 w-6 h-6 text-arc-green bg-[#07080E] rounded-full"
                    />
                  )}
                  {island.active && (
                    <motion.div
                      className="absolute -bottom-1 left-1/2 -translate-x-1/2 whitespace-nowrap text-[10px] font-bold px-2 py-0.5 rounded-full"
                      style={{ background: island.color, color: '#07080E' }}
                      animate={{ scale: [1, 1.05, 1] }}
                      transition={{ duration: 2, repeat: Infinity }}
                    >
                      در حال یادگیری
                    </motion.div>
                  )}
                </div>
                <p className="mt-3 text-xs sm:text-sm font-semibold text-white/75">{island.label}</p>
              </div>
            </motion.div>
          )
        })}
      </div>

      {/* مه پایین */}
      <div
        className="absolute bottom-0 inset-x-0 h-24 pointer-events-none"
        style={{
          background: 'linear-gradient(0deg, #07080E 0%, transparent 100%)',
        }}
        aria-hidden
      />
    </div>
  )
}
