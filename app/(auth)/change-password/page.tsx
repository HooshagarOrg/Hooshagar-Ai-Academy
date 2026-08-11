'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Eye, EyeOff, Loader2, CheckCircle2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { createClient } from '@/lib/supabase/client'
import { isPlaceholderParentName } from '@/lib/bulk-import/parent-name'
import { PASSWORD_GUIDE_FA, PASSWORD_UI_RULES } from '@/lib/security/password-policy'

export default function ChangePasswordPage(): JSX.Element {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [showNew, setShowNew] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [needsFullName, setNeedsFullName] = useState(false)
  const [fullName, setFullName] = useState('')

  useEffect(() => {
    let cancelled = false
    void (async () => {
      try {
        const supabase = createClient()
        const { data: { user } } = await supabase.auth.getUser()
        if (!user || cancelled) return
        const { data: profile } = await supabase
          .from('profiles')
          .select('full_name, role')
          .eq('id', user.id)
          .maybeSingle()
        if (cancelled || !profile) return
        if (profile.role === 'parent' && isPlaceholderParentName(profile.full_name)) {
          setNeedsFullName(true)
          setFullName('')
        }
      } catch {
        // ignore — فرم رمز همچنان کار می‌کند
      }
    })()
    return () => { cancelled = true }
  }, [])

  const allRulesMet = PASSWORD_UI_RULES.every((r) => r.test(newPassword))
  const passwordsMatch = newPassword === confirmPassword && confirmPassword.length > 0

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>): Promise<void> => {
    e.preventDefault()

    if (needsFullName && fullName.trim().length < 2) {
      toast.error('لطفاً نام و نام خانوادگی واقعی خود را وارد کنید')
      return
    }

    if (!allRulesMet) {
      toast.error('رمز عبور باید تمام شرایط را داشته باشد')
      return
    }

    if (!passwordsMatch) {
      toast.error('رمزهای وارد شده یکسان نیستند')
      return
    }

    setIsLoading(true)
    try {
      const response = await fetch('/api/auth/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          newPassword,
          full_name: needsFullName ? fullName.trim() : undefined,
        }),
      })
      const data = await response.json() as { success?: boolean; error?: string }

      if (response.ok && data.success) {
        toast.success('رمز عبور با موفقیت تغییر یافت')
        router.replace('/dashboard')
      } else {
        toast.error(data.error || 'خطا در تغییر رمز')
      }
    } catch {
      toast.error('خطای اتصال به سرور')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <form onSubmit={(e) => void handleSubmit(e)} className="w-full space-y-5" dir="rtl">
      {needsFullName && (
        <div className="space-y-2">
          <Label htmlFor="full-name">نام و نام خانوادگی</Label>
          <Input
            id="full-name"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            placeholder="نام واقعی خود را وارد کنید"
            required
            disabled={isLoading}
            className="lp-input-dark"
            autoComplete="name"
          />
          <p className="text-[11px] text-[var(--lux-text-muted)] leading-[1.8]">
            حساب شما با نام موقت ساخته شده؛ لطفاً نام واقعی را تکمیل کنید.
          </p>
        </div>
      )}

      <div className="space-y-2">
        <Label htmlFor="new-password">رمز عبور جدید</Label>
        <div className="relative">
          <Input
            id="new-password"
            type={showNew ? 'text' : 'password'}
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            placeholder="رمز عبور جدید"
            required
            disabled={isLoading}
            className="lp-input-dark pl-10 text-left"
            dir="ltr"
            autoComplete="new-password"
          />
          <button
            type="button"
            onClick={() => setShowNew((v) => !v)}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--lux-text-muted)]"
            aria-label={showNew ? 'مخفی کردن رمز' : 'نمایش رمز'}
          >
            {showNew ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        </div>
        <p className="text-[11px] text-[var(--lux-text-muted)] leading-[1.8] text-right">
          {PASSWORD_GUIDE_FA}
        </p>
      </div>

      <ul className="space-y-1.5 text-xs">
        {PASSWORD_UI_RULES.map((rule) => {
          const ok = rule.test(newPassword)
          return (
            <li key={rule.id} className={`flex items-center gap-2 ${ok ? 'text-emerald-400' : 'text-[var(--lux-text-muted)]'}`}>
              <CheckCircle2 className="h-3.5 w-3.5" aria-hidden="true" />
              {rule.label}
            </li>
          )
        })}
      </ul>

      <div className="space-y-2">
        <Label htmlFor="confirm-password">تکرار رمز عبور</Label>
        <div className="relative">
          <Input
            id="confirm-password"
            type={showConfirm ? 'text' : 'password'}
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            placeholder="تکرار رمز عبور"
            required
            disabled={isLoading}
            className="lp-input-dark pl-10 text-left"
            dir="ltr"
            autoComplete="new-password"
          />
          <button
            type="button"
            onClick={() => setShowConfirm((v) => !v)}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--lux-text-muted)]"
            aria-label={showConfirm ? 'مخفی کردن رمز' : 'نمایش رمز'}
          >
            {showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        </div>
      </div>

      <Button type="submit" className="lux-btn-primary w-full" disabled={isLoading || !allRulesMet || !passwordsMatch}>
        {isLoading ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            در حال ذخیره…
          </>
        ) : (
          'ذخیره و ادامه'
        )}
      </Button>
    </form>
  )
}
