'use client'

import type { ReactNode } from 'react'
import { motion, useReducedMotion } from 'framer-motion'
import {
  CheckCircle2,
  Lightbulb,
  MessageCircle,
  Mic,
  Sparkles,
  Star,
  Target,
  TrendingUp,
} from 'lucide-react'
import { HooshiarCharacter } from '@/components/avatar/hooshiar-character'
import { cn } from '@/lib/utils'

interface SoftCardProps {
  children: ReactNode
  className?: string
  interactive?: boolean
}

export function SoftCard({ children, className, interactive = false }: SoftCardProps) {
  return (
    <div
      className={cn(
        'hf-card rounded-[1.75rem]',
        interactive && 'transition-transform duration-200 hover:-translate-y-1 cursor-pointer',
        className,
      )}
    >
      {children}
    </div>
  )
}

interface SoftFeatureCardProps {
  icon: ReactNode
  title: string
  description: string
  color?: string
  className?: string
}

export function SoftFeatureCard({
  icon,
  title,
  description,
  color = '#8B7CFF',
  className,
}: SoftFeatureCardProps) {
  return (
    <SoftCard interactive className={cn('p-5 sm:p-6', className)}>
      <div
        className="mb-5 flex h-12 w-12 items-center justify-center rounded-2xl"
        style={{
          background: `${color}18`,
          color,
          boxShadow: `0 16px 34px ${color}18`,
        }}
      >
        {icon}
      </div>
      <h3 className="mb-2 text-base font-black text-[#111827]">{title}</h3>
      <p className="text-sm leading-7 text-[#64748B]">{description}</p>
    </SoftCard>
  )
}

const JOURNEY_STEPS = [
  { title: 'ریاضی', color: '#8B7CFF', done: true },
  { title: 'علوم', color: '#54D2FF', done: true },
  { title: 'فیزیک', color: '#FFB347', active: true },
  { title: 'ادبیات', color: '#39D98A' },
  { title: 'استعداد', color: '#FF4DA6' },
]

export function LearningJourneyPreview({ className }: { className?: string }) {
  const reduce = useReducedMotion()

  return (
    <SoftCard className={cn('relative overflow-hidden p-5 sm:p-7', className)}>
      <div className="mb-5 flex items-start justify-between gap-4">
        <div>
          <p className="hf-kicker mb-1">مسیر یادگیری</p>
          <h3 className="text-xl font-black text-[#111827]">مسیر یادگیری امروز</h3>
          <p className="mt-1 text-sm text-[#64748B]">برنامه شخصی‌سازی‌شده با AI</p>
        </div>
        <div className="rounded-2xl bg-[#8B7CFF]/10 p-3 text-[#8B7CFF]">
          <Target className="h-5 w-5" />
        </div>
      </div>

      <div className="relative py-6" style={{ perspective: 900 }}>
        <div className="absolute left-8 right-8 top-1/2 h-1 -translate-y-1/2 rounded-full bg-[#DCE8FF]" />
        <div className="relative grid grid-cols-5 gap-2">
          {JOURNEY_STEPS.map((step, index) => (
            <motion.div
              key={step.title}
              className="flex flex-col items-center gap-3"
              initial={reduce ? false : { opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.08, duration: 0.45 }}
            >
              <motion.div
                className="relative flex h-14 w-14 items-center justify-center rounded-2xl border bg-white"
                animate={!reduce && step.active ? { y: [0, -8, 0] } : undefined}
                transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
                style={{
                  borderColor: `${step.color}55`,
                  boxShadow: step.active
                    ? `0 18px 42px ${step.color}40`
                    : '0 12px 28px rgba(30,41,59,0.08)',
                }}
              >
                <Star className="h-5 w-5" style={{ color: step.color }} />
                {step.done && (
                  <CheckCircle2 className="absolute -right-1 -top-1 h-5 w-5 rounded-full bg-white text-[#39D98A]" />
                )}
              </motion.div>
              <span className="text-xs font-bold text-[#334155]">{step.title}</span>
            </motion.div>
          ))}
        </div>
      </div>
    </SoftCard>
  )
}

export function AITutorPreview({ className }: { className?: string }) {
  return (
    <SoftCard className={cn('overflow-hidden p-5 sm:p-6', className)}>
      <div className="mb-5 flex items-center gap-3">
        <div className="hf-ai-orb flex h-14 w-14 items-center justify-center rounded-2xl">
          <HooshiarCharacter size="sm" mood="talking" />
        </div>
        <div>
          <h3 className="font-black text-[#111827]">همراه یادگیری AI</h3>
          <p className="text-xs text-[#64748B]">آماده توضیح، تمرین و راهنمایی</p>
        </div>
      </div>

      <div className="space-y-3">
        <div className="w-[88%] rounded-2xl rounded-tr-md bg-[#EAF1FF] p-3 text-sm text-[#334155]">
          اگر کسرها را خوب متوجه نشدی، از شکل و مثال شروع کنیم؟
        </div>
        <div className="mr-auto w-[78%] rounded-2xl rounded-tl-md bg-gradient-to-l from-[#8B7CFF] to-[#54D2FF] p-3 text-sm text-white">
          آره، با مثال پیتزا توضیح بده.
        </div>
      </div>

      <div className="mt-5 grid grid-cols-2 gap-2">
        {[
          { icon: Lightbulb, text: 'توضیح مفهوم' },
          { icon: MessageCircle, text: 'سوال پیشنهادی' },
          { icon: Mic, text: 'آماده صوت' },
          { icon: Sparkles, text: 'تمرین جدید' },
        ].map(({ icon: Icon, text }) => (
          <button
            key={text}
            className="inline-flex items-center justify-center gap-2 rounded-2xl border border-[#DCE8FF] bg-white/70 px-3 py-2 text-xs font-bold text-[#475569] transition-colors hover:border-[#8B7CFF]/40 hover:text-[#8B7CFF]"
          >
            <Icon className="h-3.5 w-3.5" />
            {text}
          </button>
        ))}
      </div>
    </SoftCard>
  )
}

export function TalentRadarPreview({ className }: { className?: string }) {
  const points = '50,10 84,34 72,78 28,78 16,34'

  return (
    <SoftCard className={cn('p-5 sm:p-6', className)}>
      <div className="mb-5 flex items-start justify-between gap-4">
        <div>
          <p className="hf-kicker mb-1">کشف استعداد</p>
          <h3 className="text-xl font-black text-[#111827]">رادار استعداد</h3>
          <p className="mt-1 text-sm text-[#64748B]">تحلیل نقاط قوت و مسیر رشد</p>
        </div>
        <TrendingUp className="h-6 w-6 text-[#39D98A]" />
      </div>

      <div className="grid gap-5 sm:grid-cols-[180px_1fr] sm:items-center">
        <svg viewBox="0 0 100 100" className="mx-auto h-44 w-44">
          {[40, 30, 20, 10].map((offset) => (
            <polygon
              key={offset}
              points={`50,${offset} ${100 - offset / 2},${50 - offset / 3} ${78 - offset / 5},${100 - offset / 2} ${22 + offset / 5},${100 - offset / 2} ${offset / 2},${50 - offset / 3}`}
              fill="none"
              stroke="#DCE8FF"
              strokeWidth="0.8"
            />
          ))}
          <polygon points={points} fill="rgba(139,124,255,0.22)" stroke="#8B7CFF" strokeWidth="2.2" />
          {points.split(' ').map((point) => {
            const [cx, cy] = point.split(',')
            return <circle key={point} cx={cx} cy={cy} r="2.8" fill="#FF4DA6" />
          })}
        </svg>

        <div className="space-y-3">
          {[
            ['منطق و تحلیل', '۹۵٪', '#8B7CFF'],
            ['خلاقیت', '۸۸٪', '#FFB347'],
            ['زبان و ارتباط', '۷۸٪', '#39D98A'],
          ].map(([label, value, color]) => (
            <div key={label}>
              <div className="mb-1 flex items-center justify-between text-xs font-bold text-[#475569]">
                <span>{label}</span>
                <span style={{ color }}>{value}</span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-[#EAF1FF]">
                <div className="h-full rounded-full" style={{ width: value, background: color }} />
              </div>
            </div>
          ))}
        </div>
      </div>
    </SoftCard>
  )
}
