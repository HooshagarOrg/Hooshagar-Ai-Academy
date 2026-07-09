'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Eye, EyeOff, Loader2, CheckCircle2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

const passwordRules = [
  { id: 'length', label: 'حداقل ۸ کاراکتر', test: (p: string) => p.length >= 8 },
  { id: 'upper', label: 'حداقل یک حرف بزرگ', test: (p: string) => /[A-Z]/.test(p) },
  { id: 'lower', label: 'حداقل یک حرف کوچک', test: (p: string) => /[a-z]/.test(p) },
  { id: 'number', label: 'حداقل یک عدد', test: (p: string) => /[0-9]/.test(p) },
]

export default function ChangePasswordPage(): JSX.Element {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [showNew, setShowNew] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')

  const allRulesMet = passwordRules.every((r) => r.test(newPassword))
  const passwordsMatch = newPassword === confirmPassword && confirmPassword.length > 0

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>): Promise<void> => {
    e.preventDefault()

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
        body: JSON.stringify({ newPassword }),
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
            className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--lux-text-muted)]"
            onClick={() => setShowNew(!showNew)}
            tabIndex={-1}
            aria-label={showNew ? 'مخفی کردن رمز' : 'نمایش رمز'}
          >
            {showNew ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        </div>
      </div>

      {newPassword.length > 0 && (
        <div className="grid grid-cols-2 gap-2">
          {passwordRules.map((rule) => (
            <div
              key={rule.id}
              className={`flex items-center gap-1.5 text-xs transition-colors ${
                rule.test(newPassword)
                  ? 'text-[var(--lux-success)]'
                  : 'text-[var(--lux-text-muted)]'
              }`}
            >
              <CheckCircle2 className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
              {rule.label}
            </div>
          ))}
        </div>
      )}

      <div className="space-y-2">
        <Label htmlFor="confirm-password">تکرار رمز عبور</Label>
        <div className="relative">
          <Input
            id="confirm-password"
            type={showConfirm ? 'text' : 'password'}
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            placeholder="رمز عبور را مجدداً وارد کنید"
            required
            disabled={isLoading}
            className="lp-input-dark pl-10 text-left"
            dir="ltr"
            autoComplete="new-password"
          />
          <button
            type="button"
            className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--lux-text-muted)]"
            onClick={() => setShowConfirm(!showConfirm)}
            tabIndex={-1}
            aria-label={showConfirm ? 'مخفی کردن رمز' : 'نمایش رمز'}
          >
            {showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        </div>
        {confirmPassword.length > 0 && !passwordsMatch && (
          <p className="text-xs text-[var(--lux-accent)]">رمزهای وارد شده یکسان نیستند</p>
        )}
      </div>

      <Button
        type="submit"
        className="lux-btn-accent w-full"
        disabled={isLoading || !allRulesMet || !passwordsMatch}
      >
        {isLoading ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
            در حال ذخیره...
          </>
        ) : (
          'ذخیره رمز عبور جدید'
        )}
      </Button>
    </form>
  )
}
