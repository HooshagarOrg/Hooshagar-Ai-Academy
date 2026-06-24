'use client'

import { useState, type ReactNode } from 'react'
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion'
import Link from 'next/link'
import { GraduationCap, BookOpen, Heart, BarChart3, HelpCircle } from 'lucide-react'
import { ChromaticCanvas } from '@/components/ui/chromatic-canvas'
import { ArcBloom } from '@/components/motion/arc-bloom'
import { HooshagarLogo } from '@/components/brand/hooshagar-logo'
import { cn } from '@/lib/utils'

type RoleKey = 'student' | 'teacher' | 'parent' | 'admin' | 'counselor'

interface RoleOption {
  id: RoleKey
  label: string
  color: string
  glowRgb: string
  icon: React.ElementType
}

const ROLE_OPTIONS: RoleOption[] = [
  { id: 'student',   label: 'دانش‌آموز', color: '#3B82F6', glowRgb: '59,130,246',  icon: GraduationCap },
  { id: 'teacher',   label: 'معلم',       color: '#10B981', glowRgb: '16,185,129',  icon: BookOpen },
  { id: 'parent',    label: 'والدین',     color: '#F59E0B', glowRgb: '245,158,11',  icon: Heart },
  { id: 'admin',     label: 'مدیر',       color: '#EC4899', glowRgb: '236,72,153',  icon: BarChart3 },
  { id: 'counselor', label: 'مشاور',      color: '#EF4444', glowRgb: '239,68,68',   icon: HelpCircle },
]

const ROLE_STATS: Record<RoleKey, { label: string; value: string }[]> = {
  student:   [{ label: 'قابلیت AI',    value: '۱۲' }, { label: 'درس کمک',   value: '۲۴/۷' }, { label: 'XP سیستم',  value: '✓' }],
  teacher:   [{ label: 'ابزار هوشمند', value: '۸' },  { label: 'آزمون‌ساز', value: '✓' },    { label: 'تحلیل‌گر', value: '✓' }],
  parent:    [{ label: 'گزارش فرزند',  value: '✓' },  { label: 'حضور آنی',  value: '✓' },    { label: 'مشاوره',    value: '✓' }],
  admin:     [{ label: 'کنترل AI',     value: '✓' },  { label: 'گزارش کامل','value': '✓' },  { label: 'امنیت',     value: '✓' }],
  counselor: [{ label: 'پرونده',       value: '✓' },  { label: 'بینش خانواده','value': '✓' }, { label: 'گزارش',     value: '✓' }],
}

interface SpectrumPortalProps {
  children: ReactNode
}

export function SpectrumPortal({ children }: SpectrumPortalProps) {
  const reduce = useReducedMotion()
  const [activeRole, setActiveRole] = useState<RoleKey>('student')

  const role = ROLE_OPTIONS.find((r) => r.id === activeRole)!

  return (
    <div
      className="relative min-h-app flex overflow-hidden"
      dir="rtl"
      data-role={activeRole}
    >
      <ChromaticCanvas mode="immersive" />

      {/* ══ سمت چپ — ArcBloom + آمار ══ */}
      <div className="hidden lg:flex flex-col items-center justify-center w-[420px] xl:w-[480px] flex-shrink-0 relative z-10 px-10">
        {/* Logo */}
        <div className="absolute top-8 right-8">
          <HooshagarLogo size="sm" href="/" showWordmark />
        </div>

        {/* ArcBloom کوچک */}
        <motion.div
          key={activeRole}
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
          className="mb-10"
        >
          <ArcBloom className="w-64 h-64" />
        </motion.div>

        {/* انتخاب نقش */}
        <div className="w-full space-y-2 mb-8">
          <p className="text-xs text-white/35 mb-3 tracking-widest uppercase text-center">
            نقش خود را انتخاب کنید
          </p>
          {ROLE_OPTIONS.map((r) => {
            const Icon = r.icon
            const isActive = r.id === activeRole
            return (
              <motion.button
                key={r.id}
                onClick={() => setActiveRole(r.id)}
                className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-right transition-all"
                style={{
                  background: isActive ? `${r.color}15` : 'rgba(255,255,255,0.03)',
                  border: `1px solid ${isActive ? `${r.color}45` : 'rgba(255,255,255,0.06)'}`,
                  color: isActive ? r.color : 'rgba(255,255,255,0.5)',
                }}
                whileHover={reduce ? undefined : { scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <Icon className="w-4 h-4 flex-shrink-0" />
                <span className="text-sm font-medium">{r.label}</span>
                {isActive && (
                  <motion.span
                    layoutId="role-active-dot"
                    className="mr-auto w-1.5 h-1.5 rounded-full"
                    style={{ background: r.color }}
                  />
                )}
              </motion.button>
            )
          })}
        </div>

        {/* آمار نقش */}
        <AnimatePresence mode="wait">
          <motion.div
            key={activeRole}
            className="w-full grid grid-cols-3 gap-2"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.3 }}
          >
            {ROLE_STATS[activeRole].map((s) => (
              <div
                key={s.label}
                className="flex flex-col items-center gap-1 py-3 rounded-xl"
                style={{
                  background: `${role.color}0D`,
                  border: `1px solid ${role.color}22`,
                }}
              >
                <span className="text-sm font-bold" style={{ color: role.color }}>
                  {s.value}
                </span>
                <span className="text-[10px] text-white/35 text-center">{s.label}</span>
              </div>
            ))}
          </motion.div>
        </AnimatePresence>

        <p className="text-xs text-white/20 mt-10 text-center">
          © {new Date().getFullYear()} هوشاگر
        </p>
      </div>

      {/* ══ جداکننده عمودی ══ */}
      <div
        className="hidden lg:block w-px flex-shrink-0 z-10"
        style={{ background: 'rgba(255,255,255,0.05)' }}
      />

      {/* ══ سمت راست — فرم ══ */}
      <div className="flex-1 relative z-10 flex flex-col items-center justify-center p-6 sm:p-10 min-h-app pt-safe overflow-y-auto">
        {/* Logo موبایل */}
        <div className="lg:hidden mb-8">
          <HooshagarLogo size="sm" href="/" showWordmark />
        </div>

        {/* Role pills موبایل */}
        <div className="lg:hidden flex gap-2 flex-wrap justify-center mb-8">
          {ROLE_OPTIONS.map((r) => {
            const Icon = r.icon
            const isActive = r.id === activeRole
            return (
              <button
                key={r.id}
                onClick={() => setActiveRole(r.id)}
                className={cn(
                  'flex items-center gap-1.5 px-3 h-8 rounded-full text-xs font-medium transition-all',
                  isActive ? 'text-white' : 'text-white/45',
                )}
                style={{
                  background: isActive ? `${r.color}22` : 'rgba(255,255,255,0.05)',
                  border: `1px solid ${isActive ? `${r.color}50` : 'rgba(255,255,255,0.07)'}`,
                }}
              >
                <Icon className="w-3.5 h-3.5" style={{ color: isActive ? r.color : undefined }} />
                {r.label}
              </button>
            )
          })}
        </div>

        {/* کارت فرم */}
        <AnimatePresence mode="wait">
          <motion.div
            key={activeRole}
            className="w-full max-w-md"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
          >
            <div
              className="rounded-3xl p-6 sm:p-8"
              style={{
                background: 'rgba(12,13,21,0.88)',
                backdropFilter: 'blur(28px)',
                border: `1px solid ${role.color}30`,
                boxShadow: `0 16px 56px rgba(0,0,0,0.55), 0 0 0 1px ${role.color}15`,
              }}
            >
              {/* هدر کارت */}
              <div className="flex items-center gap-3 mb-6 pb-5 border-b border-white/[0.06]">
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center"
                  style={{ background: `${role.color}18`, border: `1px solid ${role.color}35` }}
                >
                  {(() => {
                    const Icon = role.icon
                    return <Icon className="w-5 h-5" style={{ color: role.color }} />
                  })()}
                </div>
                <div>
                  <p className="text-xs text-white/35">ورود به پنل</p>
                  <p className="text-sm font-bold text-white">{role.label}</p>
                </div>
              </div>

              {/* فرم توسط children inject می‌شود */}
              {children}
            </div>

            <div className="text-center mt-6">
              <Link
                href="/"
                className="text-xs text-white/25 hover:text-white/50 transition-colors"
              >
                بازگشت به صفحه اصلی
              </Link>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  )
}
