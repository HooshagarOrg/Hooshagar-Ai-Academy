'use client'

import { useMemo, useState, Suspense } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { toast } from 'sonner'
import { ArrowLeft, CheckCircle2, Eye, EyeOff, Loader2, Lock } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'

const passwordRules = [
  { id: 'length', label: 'حداقل ۶ کاراکتر', test: (p: string) => p.length >= 6 },
  { id: 'number', label: 'حداقل یک عدد', test: (p: string) => /[0-9]/.test(p) },
]

function ResetPasswordForm(): JSX.Element {
  const router = useRouter()
  const searchParams = useSearchParams()
  const phone = searchParams.get('phone') ?? ''
  const token = searchParams.get('token') ?? ''

  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  const validParams = useMemo(
    () => /^09[0-9]{9}$/.test(phone) && token.length > 0,
    [phone, token],
  )

  const allRulesMet = passwordRules.every((r) => r.test(password))
  const passwordsMatch = password === confirm && confirm.length > 0

  const handleSubmit = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault()
    if (!validParams) {
      toast.error('لینک بازیابی نامعتبر است. دوباره درخواست دهید.')
      return
    }
    if (!allRulesMet || !passwordsMatch) {
      toast.error('رمز عبور شرایط لازم را ندارد')
      return
    }
    setIsLoading(true)
    try {
      const res = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phoneNumber: phone,
          resetToken: token,
          newPassword: password,
        }),
      })
      const data = await res.json() as { success?: boolean; error?: string }
      if (!res.ok || !data.success) {
        toast.error(data.error || 'تغییر رمز ناموفق بود')
        return
      }
      toast.success('رمز عبور با موفقیت تغییر کرد')
      router.replace('/login')
    } catch {
      toast.error('خطای اتصال به سرور')
    } finally {
      setIsLoading(false)
    }
  }

  if (!validParams) {
    return (
      <div className="space-y-4 text-center" dir="rtl">
        <p className="text-sm text-[var(--lux-text-muted)]">
          لینک بازیابی نامعتبر یا منقضی شده است.
        </p>
        <Link href="/forgot-password" className="lux-btn-accent inline-flex px-6 py-2 text-sm">
          درخواست مجدد
        </Link>
      </div>
    )
  }

  return (
    <form onSubmit={(e) => void handleSubmit(e)} className="w-full space-y-5" dir="rtl">
      <p className="text-sm text-[var(--lux-text-muted)]">
        رمز جدید برای شماره{' '}
        <span className="font-mono text-[var(--lux-text)]" dir="ltr">
          {phone}
        </span>
      </p>

      <div className="space-y-2">
        <Label htmlFor="password">رمز عبور جدید</Label>
        <div className="relative">
          <Input
            id="password"
            type={showPassword ? 'text' : 'password'}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="lp-input-dark pl-10 text-left"
            dir="ltr"
            disabled={isLoading}
            required
          />
          <button
            type="button"
            className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--lux-text-muted)]"
            onClick={() => setShowPassword((v) => !v)}
            aria-label={showPassword ? 'مخفی کردن رمز' : 'نمایش رمز'}
          >
            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="confirm">تکرار رمز عبور</Label>
        <Input
          id="confirm"
          type="password"
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          className="lp-input-dark text-left"
          dir="ltr"
          disabled={isLoading}
          required
        />
      </div>

      <ul className="space-y-1.5 text-xs">
        {passwordRules.map((rule) => {
          const ok = rule.test(password)
          return (
            <li
              key={rule.id}
              className={`flex items-center gap-2 ${ok ? 'text-[var(--lux-success)]' : 'text-[var(--lux-text-muted)]'}`}
            >
              <CheckCircle2 className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
              {rule.label}
            </li>
          )
        })}
      </ul>

      <Button
        type="submit"
        className="lux-btn-accent w-full"
        disabled={isLoading || !allRulesMet || !passwordsMatch}
      >
        {isLoading ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <>
            <Lock className="h-4 w-4" aria-hidden="true" />
            ذخیره رمز جدید
          </>
        )}
      </Button>

      <Link
        href="/login"
        className="inline-flex items-center gap-1.5 text-sm font-bold text-[var(--lux-text-muted)] hover:text-[var(--lux-text)]"
      >
        <ArrowLeft className="h-4 w-4" aria-hidden="true" />
        بازگشت به ورود
      </Link>
    </form>
  )
}

export default function ResetPasswordPage(): JSX.Element {
  return (
    <Suspense
      fallback={
        <div className="flex justify-center py-8">
          <Loader2 className="h-8 w-8 animate-spin text-[var(--lux-primary)]" />
        </div>
      }
    >
      <ResetPasswordForm />
    </Suspense>
  )
}
