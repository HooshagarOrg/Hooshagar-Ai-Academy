'use client'

import { useState } from 'react'
import { motion, useReducedMotion } from 'framer-motion'
import Link from 'next/link'
import {
  GraduationCap,
  BookOpen,
  Heart,
  BarChart3,
  HelpCircle,
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface RoleNode {
  id: string
  label: string
  sublabel: string
  color: string
  glow: string
  icon: React.ElementType
  href: string
  features: string[]
  angleDeg: number
}

const ROLES: RoleNode[] = [
  {
    id: 'student',
    label: 'دانش‌آموز',
    sublabel: 'یادگیری هوشمند',
    color: '#3B82F6',
    glow: 'rgba(59,130,246,0.45)',
    icon: GraduationCap,
    href: '/login',
    features: ['حل مسئله OCR', 'دستیار مطالعه', 'باغ استعداد', 'کنکور هوشمند'],
    angleDeg: 270,   /* بالا */
  },
  {
    id: 'teacher',
    label: 'معلم',
    sublabel: 'کلاس پیشرفته',
    color: '#10B981',
    glow: 'rgba(16,185,129,0.45)',
    icon: BookOpen,
    href: '/login',
    features: ['تحلیلگر دانش‌آموز', 'بانک سوال AI', 'گزارش هفتگی', 'آزمون‌ساز'],
    angleDeg: 342,   /* راست-بالا */
  },
  {
    id: 'parent',
    label: 'والدین',
    sublabel: 'ارتباط خانه-مدرسه',
    color: '#F59E0B',
    glow: 'rgba(245,158,11,0.45)',
    icon: Heart,
    href: '/login',
    features: ['گزارش فرزند', 'حضور و غیاب', 'امور مالی', 'مشاوره آنلاین'],
    angleDeg: 54,    /* راست-پایین */
  },
  {
    id: 'admin',
    label: 'مدیر',
    sublabel: 'مرکز فرمان',
    color: '#EC4899',
    glow: 'rgba(236,72,153,0.45)',
    icon: BarChart3,
    href: '/login',
    features: ['مدیریت مدرسه', 'سیستم AI', 'گزارش تحلیلی', 'امنیت'],
    angleDeg: 126,   /* چپ-پایین */
  },
  {
    id: 'counselor',
    label: 'مشاور',
    sublabel: 'رشد و توسعه',
    color: '#EF4444',
    glow: 'rgba(239,68,68,0.45)',
    icon: HelpCircle,
    href: '/login',
    features: ['پرونده مشاوره', 'بینش خانواده', 'گزارش رشد', 'مشاوره تحصیلی'],
    angleDeg: 198,   /* چپ */
  },
]

interface RolesOrbitProps {
  className?: string
}

export function RolesOrbit({ className }: RolesOrbitProps) {
  const [active, setActive] = useState<string | null>(null)
  const reduce = useReducedMotion()

  const orbitR = 42  /* % از container */
  const size   = 500 /* px baseline */

  return (
    <div
      className={cn('relative select-none', className)}
      style={{ width: size, height: size, maxWidth: '100%' }}
    >
      {/* حلقه مدار */}
      <svg
        viewBox={`0 0 ${size} ${size}`}
        className="absolute inset-0 w-full h-full pointer-events-none"
        aria-hidden
      >
        {/* حلقه اصلی */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={(orbitR * size) / 100}
          fill="none"
          stroke="rgba(255,255,255,0.06)"
          strokeWidth="1"
          strokeDasharray="4 8"
        />
        {/* حلقه داخلی */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={(orbitR * size) / 100 * 0.55}
          fill="none"
          stroke="rgba(255,255,255,0.04)"
          strokeWidth="1"
        />
        {/* خطوط اتصال به مرکز */}
        {ROLES.map((role) => {
          const rad = (role.angleDeg * Math.PI) / 180
          const r   = (orbitR * size) / 100
          const x1  = size / 2
          const y1  = size / 2
          const x2  = size / 2 + r * Math.cos(rad)
          const y2  = size / 2 + r * Math.sin(rad)
          return (
            <line
              key={role.id}
              x1={x1} y1={y1} x2={x2} y2={y2}
              stroke={active === role.id ? role.color : 'rgba(255,255,255,0.04)'}
              strokeWidth={active === role.id ? 1.5 : 1}
              strokeDasharray="3 6"
              style={{ transition: 'stroke 300ms' }}
            />
          )
        })}
      </svg>

      {/* نقاط orbit */}
      {ROLES.map((role) => {
        const rad  = (role.angleDeg * Math.PI) / 180
        const r    = (orbitR * size) / 100
        const cx   = size / 2 + r * Math.cos(rad)
        const cy   = size / 2 + r * Math.sin(rad)
        const isActive = active === role.id
        const Icon = role.icon

        return (
          <motion.div
            key={role.id}
            className="absolute"
            style={{ left: cx, top: cy, transform: 'translate(-50%, -50%)' }}
            onHoverStart={() => setActive(role.id)}
            onHoverEnd={() => setActive(null)}
            animate={
              !reduce && !isActive
                ? {
                    y: [0, -5, 0],
                    transition: {
                      duration: 3 + ROLES.indexOf(role) * 0.4,
                      repeat: Infinity,
                      ease: 'easeInOut',
                    },
                  }
                : {}
            }
          >
            <Link href={role.href} className="block">
              <motion.div
                className="relative flex flex-col items-center gap-2"
                whileHover={reduce ? undefined : { scale: 1.12 }}
                transition={{ type: 'spring', stiffness: 300, damping: 20 }}
              >
                {/* icon circle */}
                <motion.div
                  className="w-14 h-14 rounded-full flex items-center justify-center"
                  style={{
                    background: `radial-gradient(circle at 35% 35%, ${role.color}28, ${role.color}10)`,
                    border: `1.5px solid ${isActive ? role.color : `${role.color}40`}`,
                    boxShadow: isActive ? `0 0 28px ${role.glow}` : 'none',
                    transition: 'all 300ms',
                  }}
                  animate={isActive ? { scale: 1.1 } : { scale: 1 }}
                  transition={{ duration: 0.25 }}
                >
                  <Icon
                    className="w-6 h-6"
                    style={{ color: role.color, transition: 'color 200ms' }}
                  />
                </motion.div>

                {/* label */}
                <div className="text-center">
                  <p
                    className="text-sm font-bold leading-none"
                    style={{ color: isActive ? role.color : 'rgba(255,255,255,0.75)' }}
                  >
                    {role.label}
                  </p>
                </div>

                {/* tooltip */}
                {isActive && (
                  <motion.div
                    className="absolute top-full mt-3 z-50 pointer-events-none"
                    initial={{ opacity: 0, y: -6, scale: 0.9 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    style={{ minWidth: 160, left: '50%', transform: 'translateX(-50%)' }}
                  >
                    <div
                      className="rounded-xl p-3 text-right"
                      style={{
                        background: 'rgba(12,13,21,0.95)',
                        border: `1px solid ${role.color}40`,
                        boxShadow: `0 8px 32px rgba(0,0,0,0.5), 0 0 0 1px ${role.color}20`,
                      }}
                    >
                      <p className="text-xs font-semibold mb-1.5" style={{ color: role.color }}>
                        {role.sublabel}
                      </p>
                      {role.features.map((f) => (
                        <p key={f} className="text-xs text-white/55 leading-6">
                          {f}
                        </p>
                      ))}
                    </div>
                  </motion.div>
                )}
              </motion.div>
            </Link>
          </motion.div>
        )
      })}

      {/* مرکز — لوگو هوشاگر */}
      <div
        className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 flex items-center justify-center"
        style={{
          width: 72,
          height: 72,
          borderRadius: '50%',
          background: 'radial-gradient(circle at 40% 35%, rgba(59,130,246,0.18), rgba(7,8,14,0.95) 65%)',
          border: '1px solid rgba(255,255,255,0.1)',
          boxShadow: '0 0 40px rgba(59,130,246,0.12)',
        }}
      >
        <span className="text-xl font-black text-white/90">هـ</span>
      </div>
    </div>
  )
}
