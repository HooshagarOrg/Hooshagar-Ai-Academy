'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import { Smartphone, Key, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

interface OTPLoginProps {
  onSuccess?: () => void
}

export default function OTPLogin({ onSuccess }: OTPLoginProps) {
  const [step, setStep] = useState<'phone' | 'code'>('phone')
  const [phone, setPhone] = useState('')
  const [code, setCode] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [countdown, setCountdown] = useState(0)

  const handleSendOTP = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      const response = await fetch('/api/auth/otp/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone }),
      })

      const data = await response.json()

      if (response.ok) {
        toast.success(data.message || 'کد تأیید ارسال شد')
        setStep('code')
        setCountdown(300) // 5 minutes
        
        // Start countdown timer
        const timer = setInterval(() => {
          setCountdown((prev) => {
            if (prev <= 1) {
              clearInterval(timer)
              return 0
            }
            return prev - 1
          })
        }, 1000)
      } else {
        toast.error(data.error || 'خطا در ارسال کد')
      }
    } catch (error) {
      console.error('Send OTP error:', error)
      toast.error('خطا در ارتباط با سرور')
    } finally {
      setIsLoading(false)
    }
  }

  const handleVerifyOTP = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      const response = await fetch('/api/auth/otp/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone, code }),
      })

      const data = await response.json()

      if (response.ok) {
        toast.success('ورود موفقیت‌آمیز!')
        window.location.replace(data.redirect || '/dashboard')
        onSuccess?.()
      } else {
        toast.error(data.error || 'کد تأیید نامعتبر است')
      }
    } catch (error) {
      console.error('Verify OTP error:', error)
      toast.error('خطا در ارتباط با سرور')
    } finally {
      setIsLoading(false)
    }
  }

  const formatCountdown = (seconds: number): string => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  return (
    <div className="space-y-6">
      {step === 'phone' ? (
        // مرحله 1: وارد کردن شماره موبایل
        <form onSubmit={handleSendOTP} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="otp-phone" className="text-sm font-semibold text-gray-700">
              شماره موبایل
            </Label>
            <div className="relative">
              <Smartphone className="absolute right-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
              <Input
                id="otp-phone"
                type="tel"
                placeholder="09123456789"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                required
                disabled={isLoading}
                dir="ltr"
                className="pr-12 h-12 bg-gray-50 border-2 border-gray-200 focus:border-purple-500 focus:bg-white rounded-xl transition-all text-left"
              />
            </div>
            <p className="text-xs text-gray-500">
              کد تأیید به شماره موبایل شما ارسال خواهد شد
            </p>
          </div>

          <Button
            type="submit"
            disabled={isLoading || phone.length < 11}
            className="w-full h-12 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-bold rounded-xl shadow-lg transition-all"
          >
            {isLoading ? (
              <div className="flex items-center gap-2">
                <Loader2 className="w-5 h-5 animate-spin" />
                <span>در حال ارسال...</span>
              </div>
            ) : (
              'ارسال کد تأیید'
            )}
          </Button>
        </form>
      ) : (
        // مرحله 2: وارد کردن کد OTP
        <form onSubmit={handleVerifyOTP} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="otp-code" className="text-sm font-semibold text-gray-700">
              کد تأیید
            </Label>
            <div className="relative">
              <Key className="absolute right-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
              <Input
                id="otp-code"
                type="text"
                placeholder="۱۲۳۴۵۶"
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                required
                disabled={isLoading}
                maxLength={6}
                dir="ltr"
                className="pr-12 h-12 bg-gray-50 border-2 border-gray-200 focus:border-purple-500 focus:bg-white rounded-xl transition-all text-center text-2xl tracking-widest font-mono"
              />
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-gray-500">
                کد به شماره {phone} ارسال شد
              </span>
              {countdown > 0 && (
                <span className="text-blue-600 font-semibold">
                  {formatCountdown(countdown)}
                </span>
              )}
            </div>
          </div>

          <Button
            type="submit"
            disabled={isLoading || code.length !== 6}
            className="w-full h-12 bg-gradient-to-r from-green-600 to-teal-600 hover:from-green-700 hover:to-teal-700 text-white font-bold rounded-xl shadow-lg transition-all"
          >
            {isLoading ? (
              <div className="flex items-center gap-2">
                <Loader2 className="w-5 h-5 animate-spin" />
                <span>در حال تأیید...</span>
              </div>
            ) : (
              'ورود به سیستم'
            )}
          </Button>

          <Button
            type="button"
            variant="ghost"
            onClick={() => {
              setStep('phone')
              setCode('')
              setCountdown(0)
            }}
            disabled={isLoading}
            className="w-full text-gray-600 hover:text-gray-900"
          >
            بازگشت و تغییر شماره
          </Button>

          {countdown === 0 && (
            <Button
              type="button"
              variant="outline"
              onClick={handleSendOTP}
              disabled={isLoading}
              className="w-full"
            >
              ارسال مجدد کد
            </Button>
          )}
        </form>
      )}
    </div>
  )
}

