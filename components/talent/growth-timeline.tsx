'use client'

import { useEffect, useState } from 'react'
import { motion, useReducedMotion } from 'framer-motion'
import { LuxCard } from '@/components/lux/lux-card'

const EVENTS = [
  { month: 'آذر', title: 'شروع مسیر AI', body: 'اولین گفتگو با هوشیار' },
  { month: 'دی', title: 'تمرین منظم', body: '۵ روز استریک یادگیری' },
  { month: 'بهمن', title: 'کشف استعداد', body: 'رادار چندبعدی فعال شد' },
  { month: 'اسفند', title: 'رشد درسی', body: 'پیشرفت در ریاضی و علوم' },
  { month: 'فروردین', title: 'خلاقیت', body: 'امتیاز هنری بالا رفت' },
  { month: 'اردیبهشت', title: 'هدف جدید', body: 'تعریف مسیر کنکور' },
]

export function GrowthTimelinePanel() {
  const reduce = useReducedMotion()
  const [lineWidth, setLineWidth] = useState(reduce ? 100 : 0)

  useEffect(() => {
    if (reduce) return
    const t = setTimeout(() => setLineWidth(100), 200)
    return () => clearTimeout(t)
  }, [reduce])

  return (
    <LuxCard>
      <p className="lux-kicker mb-1 text-[var(--lux-gold)]">خط زمانی رشد</p>
      <h3 className="mb-5 font-black text-[var(--lux-text)]">۶ ماه گذشته</h3>
      <div className="relative">
        <div className="absolute right-4 top-0 bottom-0 w-0.5 bg-[var(--lux-surface)]" />
        <motion.div
          className="absolute right-4 top-0 w-0.5 origin-top"
          style={{ background: 'var(--lux-gold)' }}
          initial={{ height: 0 }}
          animate={{ height: `${lineWidth}%` }}
          transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
        />
        <div className="space-y-5 pr-10">
          {EVENTS.map((ev, i) => (
            <motion.div
              key={ev.month}
              initial={reduce ? false : { opacity: 0, x: 12 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.08, duration: 0.4 }}
              className="relative"
            >
              <span
                className="absolute -right-[1.65rem] top-1 h-3 w-3 rounded-full border-2"
                style={{ borderColor: 'var(--lux-gold)', background: 'var(--lux-body)' }}
              />
              <p className="text-xs font-bold text-[var(--lux-gold)]">{ev.month}</p>
              <p className="font-bold text-[var(--lux-text)]">{ev.title}</p>
              <p className="text-xs leading-7 text-[var(--lux-text-muted)]">{ev.body}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </LuxCard>
  )
}
