'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { motion, AnimatePresence } from 'framer-motion'
import { GraduationCap, QrCode, Users, User } from 'lucide-react'
import { createClient } from '@/lib/supabase-client'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

const schema = z.object({
  full_name: z.string().min(2, 'نام باید حداقل ۲ کاراکتر باشد'),
  email: z.string().email('ایمیل معتبر وارد کنید'),
  password: z.string().min(6, 'رمز عبور حداقل ۶ کاراکتر'),
  role: z.enum(['teacher', 'parent', 'student']),
  invite_code: z.string().optional(),
})

type FormData = z.infer<typeof schema>

const STEPS = ['نقش', 'اطلاعات', 'تأیید'] as const

const ROLES = [
  { id: 'student' as const, label: 'دانش‌آموز', icon: GraduationCap },
  { id: 'parent' as const, label: 'والد', icon: Users },
  { id: 'teacher' as const, label: 'معلم', icon: User },
]

export function LuxRegisterFlow() {
  const supabase = createClient()
  const [step, setStep] = useState(0)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  const form = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { role: 'student' },
  })

  const role = form.watch('role')

  const onSubmit = async (data: FormData) => {
    setLoading(true)
    setError(null)
    try {
      const { error: authError } = await supabase.auth.signUp({
        email: data.email,
        password: data.password,
        options: {
          data: { full_name: data.full_name, role: data.role, invite_code: data.invite_code },
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      })
      if (authError) throw authError
      setSuccess('ثبت‌نام موفق! ایمیل تأیید را بررسی کنید.')
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'خطا در ثبت‌نام'
      setError(msg.includes('already') ? 'این ایمیل قبلاً ثبت شده' : 'خطا در ثبت‌نام. دوباره تلاش کنید.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="w-full" dir="rtl">
      <div className="mb-6 flex gap-2">
        {STEPS.map((label, i) => (
          <div
            key={label}
            className="h-1.5 flex-1 rounded-full transition-colors"
            style={{ background: i <= step ? 'var(--lux-primary)' : 'var(--lux-surface)' }}
          />
        ))}
      </div>

      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-1">
        <AnimatePresence mode="wait">
          {step === 0 && (
            <motion.div key="s0" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
              <p className="lux-kicker mb-3">مرحله ۱</p>
              <h2 className="mb-4 font-black text-[var(--lux-text)]">نقش خود را انتخاب کنید</h2>
              <div className="grid gap-3">
                {ROLES.map(({ id, label, icon: Icon }) => (
                  <button
                    key={id}
                    type="button"
                    onClick={() => form.setValue('role', id)}
                    className="flex items-center gap-3 rounded-xl border p-4 text-right transition-colors"
                    style={{
                      borderColor: role === id ? 'var(--lux-primary)' : 'var(--lux-surface)',
                      background: role === id ? 'rgba(139,124,255,0.12)' : 'var(--lux-card)',
                    }}
                  >
                    <Icon className="h-5 w-5 text-[var(--lux-primary)]" />
                    <span className="font-bold text-[var(--lux-text)]">{label}</span>
                  </button>
                ))}
              </div>
            </motion.div>
          )}

          {step === 1 && (
            <motion.div key="s1" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-4">
              <p className="lux-kicker mb-1">مرحله ۲</p>
              <h2 className="mb-2 font-black text-[var(--lux-text)]">اطلاعات حساب</h2>
              <div className="space-y-2">
                <Label htmlFor="full_name">نام کامل</Label>
                <Input id="full_name" className="lp-input-dark" {...form.register('full_name')} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">ایمیل</Label>
                <Input id="email" type="email" dir="ltr" className="lp-input-dark" {...form.register('email')} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">رمز عبور</Label>
                <Input id="password" type="password" dir="ltr" className="lp-input-dark" {...form.register('password')} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="invite" className="flex items-center gap-2">
                  <QrCode className="h-4 w-4" /> کد دعوت مدرسه (اختیاری)
                </Label>
                <Input id="invite" className="lp-input-dark" {...form.register('invite_code')} />
              </div>
            </motion.div>
          )}

          {step === 2 && (
            <motion.div key="s2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
              <p className="lux-kicker mb-1">مرحله ۳</p>
              <h2 className="mb-4 font-black text-[var(--lux-text)]">بررسی و تأیید</h2>
              <ul className="space-y-2 text-sm text-[var(--lux-text-muted)]">
                <li>نام: <span className="text-[var(--lux-text)]">{form.getValues('full_name') || '—'}</span></li>
                <li>ایمیل: <span className="text-[var(--lux-text)]">{form.getValues('email') || '—'}</span></li>
                <li>نقش: <span className="text-[var(--lux-text)]">{ROLES.find((r) => r.id === role)?.label}</span></li>
              </ul>
              {error && <p className="mt-4 text-sm text-red-400">{error}</p>}
              {success && <p className="mt-4 text-sm text-[var(--lux-success)]">{success}</p>}
            </motion.div>
          )}
        </AnimatePresence>

        <div className="mt-6 flex gap-2">
          {step > 0 && (
            <button type="button" onClick={() => setStep((s) => s - 1)} className="lux-btn-ghost min-h-11 flex-1 text-sm">
              قبلی
            </button>
          )}
          {step < 2 ? (
            <button
              type="button"
              onClick={() => setStep((s) => s + 1)}
              className="lux-btn-accent min-h-11 flex-1 text-sm"
            >
              بعدی
            </button>
          ) : (
            <button type="submit" disabled={loading || !!success} className="lux-btn-accent min-h-11 flex-1 text-sm disabled:opacity-50">
              {loading ? 'در حال ثبت...' : 'ثبت‌نام'}
            </button>
          )}
        </div>

        <p className="mt-4 text-center text-sm text-[var(--lux-text-muted)]">
          حساب دارید؟{' '}
          <Link href="/login" className="font-bold text-[var(--lux-primary)]">ورود</Link>
        </p>
      </form>
    </div>
  )
}
