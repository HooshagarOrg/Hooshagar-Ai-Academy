'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { ArrowLeft, Loader2, Smartphone } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'

export default function ForgotPasswordPage(): JSX.Element {
  const router = useRouter()
  const [phone, setPhone] = useState('')
  const [otp, setOtp] = useState('')
  const [step, setStep] = useState<'phone' | 'otp'>('phone')
  const [isLoading, setIsLoading] = useState(false)
  const [timer, setTimer] = useState(0)

  useEffect(() => {
    if (timer <= 0) return
    const id = window.setInterval(() => setTimer((t) => t - 1), 1000)
    return () => window.clearInterval(id)
  }, [timer])

  const sendOtp = async (): Promise<void> => {
    if (!/^09[0-9]{9}$/.test(phone)) {
      toast.error('شماره موبایل باید ۱۱ رقم و با ۰۹ شروع شود')
      return
    }
    setIsLoading(true)
    try {
      const res = await fetch('/api/auth/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phoneNumber: phone, purpose: 'reset-password' }),
      })
      const data = await res.json() as { success?: boolean; error?: string; expiresIn?: number }
      if (!res.ok || !data.success) {
        toast.error(data.error || 'ارسال کد ناموفق بود')
        return
      }
      toast.success('کد تأیید ارسال شد')
      setStep('otp')
      setTimer(data.expiresIn ?? 300)
    } catch {
      toast.error('خطای اتصال به سرور')
    } finally {
      setIsLoading(false)
    }
  }

  const verifyOtp = async (): Promise<void> => {
    if (!/^[0-9]{6}$/.test(otp)) {
      toast.error('کد تأیید باید ۶ رقم باشد')
      return
    }
    setIsLoading(true)
    try {
      const res = await fetch('/api/auth/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phoneNumber: phone, code: otp, purpose: 'reset-password' }),
      })
      const data = await res.json() as { success?: boolean; error?: string; resetToken?: string }
      if (!res.ok || !data.success || !data.resetToken) {
        toast.error(data.error || 'کد تأیید نامعتبر است')
        return
      }
      toast.success('کد تأیید شد')
      router.push(
        `/reset-password?phone=${encodeURIComponent(phone)}&token=${encodeURIComponent(data.resetToken)}`,
      )
    } catch {
      toast.error('خطای اتصال به سرور')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="w-full space-y-6" dir="rtl">
      <p className="text-sm leading-7 text-[var(--lux-text-muted)]">
        شماره موبایل ثبت‌شده را وارد کنید. کد تأیید برای بازیابی رمز ارسال می‌شود.
      </p>

      {step === 'phone' ? (
        <form
          className="space-y-4"
          onSubmit={(e) => {
            e.preventDefault()
            void sendOtp()
          }}
        >
          <div className="space-y-2">
            <Label htmlFor="phone">شماره موبایل</Label>
            <Input
              id="phone"
              value={phone}
              onChange={(e) => setPhone(e.target.value.replace(/\D/g, '').slice(0, 11))}
              placeholder="09123456789"
              className="lp-input-dark text-left"
              dir="ltr"
              disabled={isLoading}
              required
            />
          </div>
          <Button type="submit" className="lux-btn-accent w-full" disabled={isLoading}>
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
            ) : (
              <>
                <Smartphone className="h-4 w-4" aria-hidden="true" />
                ارسال کد تأیید
              </>
            )}
          </Button>
        </form>
      ) : (
        <form
          className="space-y-4"
          onSubmit={(e) => {
            e.preventDefault()
            void verifyOtp()
          }}
        >
          <div className="space-y-2">
            <Label htmlFor="otp">کد ۶ رقمی</Label>
            <Input
              id="otp"
              value={otp}
              onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
              placeholder="123456"
              className="lp-input-dark text-center text-lg tracking-[0.3em]"
              dir="ltr"
              disabled={isLoading}
              required
            />
            {timer > 0 && (
              <p className="text-xs text-[var(--lux-text-muted)]">
                ارسال مجدد تا {Math.floor(timer / 60)}:{String(timer % 60).padStart(2, '0')}
              </p>
            )}
          </div>
          <Button type="submit" className="lux-btn-accent w-full" disabled={isLoading}>
            {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'تأیید کد'}
          </Button>
          <Button
            type="button"
            variant="ghost"
            className="w-full text-[var(--lux-text-muted)]"
            disabled={isLoading || timer > 0}
            onClick={() => void sendOtp()}
          >
            ارسال مجدد کد
          </Button>
        </form>
      )}

      <Link
        href="/login"
        className="inline-flex items-center gap-1.5 text-sm font-bold text-[var(--lux-text-muted)] hover:text-[var(--lux-text)]"
      >
        <ArrowLeft className="h-4 w-4" aria-hidden="true" />
        بازگشت به ورود
      </Link>
    </div>
  )
}
