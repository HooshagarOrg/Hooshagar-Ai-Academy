'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { createClient } from '@/lib/supabase/client'
import {
  Mail,
  Lock,
  Phone,
  Shield,
  Key,
  Eye,
  EyeOff,
  Loader2,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  Sparkles,
  GraduationCap,
} from 'lucide-react'

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { toast } from 'sonner'

// ============================================
// تایپ‌ها و اینترفیس‌ها
// ============================================
type LoginMethod = 'email' | 'mobile'
type ForgotMethod = 'email' | 'mobile'
type ForgotStep = 'input' | 'otp' | 'newPassword'

interface FormErrors {
  email?: string
  password?: string
  phone?: string
  otp?: string
  newPassword?: string
  confirmPassword?: string
}

// ============================================
// Regex Patterns
// ============================================
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const PHONE_REGEX = /^09[0-9]{9}$/
const OTP_REGEX = /^[0-9]{6}$/

// ============================================
// کامپوننت OTP Input
// ============================================
interface OTPInputProps {
  value: string
  onChange: (value: string) => void
  disabled?: boolean
}

function OTPInput({ value, onChange, disabled }: OTPInputProps) {
  const inputRefs = useRef<(HTMLInputElement | null)[]>([])
  const digits = value.split('').concat(Array(6 - value.length).fill(''))

  const handleChange = (index: number, digit: string) => {
    if (!/^[0-9]?$/.test(digit)) return

    const newValue = digits.slice()
    newValue[index] = digit
    const result = newValue.join('').slice(0, 6)
    onChange(result)

    // Auto-focus next
    if (digit && index < 5) {
      inputRefs.current[index + 1]?.focus()
    }
  }

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !digits[index] && index > 0) {
      inputRefs.current[index - 1]?.focus()
    }
    if (e.key === 'ArrowLeft' && index > 0) {
      inputRefs.current[index - 1]?.focus()
    }
    if (e.key === 'ArrowRight' && index < 5) {
      inputRefs.current[index + 1]?.focus()
    }
  }

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault()
    const pastedData = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6)
    onChange(pastedData)
    if (pastedData.length === 6) {
      inputRefs.current[5]?.focus()
    } else {
      inputRefs.current[pastedData.length]?.focus()
    }
  }

  return (
    <div className="flex gap-2 justify-center" dir="ltr">
      {digits.map((digit, index) => (
        <input
          key={index}
          ref={(el) => { inputRefs.current[index] = el }}
          type="text"
          inputMode="numeric"
          maxLength={1}
          value={digit}
          onChange={(e) => handleChange(index, e.target.value)}
          onKeyDown={(e) => handleKeyDown(index, e)}
          onPaste={handlePaste}
          disabled={disabled}
          className="w-12 h-14 text-center text-2xl font-bold bg-white/10 border-2 border-white/20 rounded-xl text-white focus:border-blue-400 focus:ring-2 focus:ring-blue-400/30 outline-none transition-all disabled:opacity-50"
          aria-label={`رقم ${index + 1} از کد تایید`}
        />
      ))}
    </div>
  )
}

// ============================================
// کامپوننت Password Strength
// ============================================
function PasswordStrength({ password }: { password: string }) {
  const getStrength = (): { level: number; text: string; color: string } => {
    if (!password) return { level: 0, text: '', color: '' }
    
    let score = 0
    if (password.length >= 6) score++
    if (password.length >= 8) score++
    if (/[A-Z]/.test(password)) score++
    if (/[0-9]/.test(password)) score++
    if (/[^A-Za-z0-9]/.test(password)) score++

    if (score <= 2) return { level: 1, text: 'ضعیف', color: 'bg-red-500' }
    if (score <= 3) return { level: 2, text: 'متوسط', color: 'bg-yellow-500' }
    if (score <= 4) return { level: 3, text: 'خوب', color: 'bg-blue-500' }
    return { level: 4, text: 'قوی', color: 'bg-green-500' }
  }

  const strength = getStrength()
  if (!password) return null

  return (
    <div className="mt-2 space-y-1">
      <div className="flex gap-1">
        {[1, 2, 3, 4].map((level) => (
          <div
            key={level}
            className={`h-1.5 flex-1 rounded-full transition-colors ${
              level <= strength.level ? strength.color : 'bg-white/20'
            }`}
          />
        ))}
      </div>
      <p className={`text-xs ${strength.color.replace('bg-', 'text-')}`}>
        قدرت رمز: {strength.text}
      </p>
    </div>
  )
}

// ============================================
// کامپوننت Timer
// ============================================
function CountdownTimer({
  seconds,
  onComplete,
}: {
  seconds: number
  onComplete: () => void
}) {
  const [timeLeft, setTimeLeft] = useState(seconds)

  useEffect(() => {
    setTimeLeft(seconds)
  }, [seconds])

  useEffect(() => {
    if (timeLeft <= 0) {
      onComplete()
      return
    }

    const timer = setInterval(() => {
      setTimeLeft((prev) => prev - 1)
    }, 1000)

    return () => clearInterval(timer)
  }, [timeLeft, onComplete])

  const minutes = Math.floor(timeLeft / 60)
  const secs = timeLeft % 60

  return (
    <span className="font-mono text-white/60">
      {minutes}:{secs.toString().padStart(2, '0')}
    </span>
  )
}

// ============================================
// کامپوننت اصلی صفحه ورود
// ============================================
export default function LoginPage() {
  const router = useRouter()
  const supabase = createClient()

  // ============================================
  // State Management
  // ============================================
  const [activeTab, setActiveTab] = useState<LoginMethod>('email')
  
  // Email login
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [rememberMe, setRememberMe] = useState(false)
  
  // Mobile login
  const [phone, setPhone] = useState('')
  const [otp, setOtp] = useState('')
  const [otpSent, setOtpSent] = useState(false)
  const [timerKey, setTimerKey] = useState(0)
  const [canResend, setCanResend] = useState(false)
  const [otpAttempts, setOtpAttempts] = useState(0)
  const [isBlocked, setIsBlocked] = useState(false)
  const [blockTimer, setBlockTimer] = useState(0)
  
  // Forgot password
  const [showForgotPassword, setShowForgotPassword] = useState(false)
  const [forgotMethod, setForgotMethod] = useState<ForgotMethod>('email')
  const [forgotStep, setForgotStep] = useState<ForgotStep>('input')
  const [forgotEmail, setForgotEmail] = useState('')
  const [forgotPhone, setForgotPhone] = useState('')
  const [forgotOtp, setForgotOtp] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [forgotOtpSent, setForgotOtpSent] = useState(false)
  const [forgotTimerKey, setForgotTimerKey] = useState(0)
  const [forgotCanResend, setForgotCanResend] = useState(false)
  
  // Loading states
  const [loading, setLoading] = useState(false)
  const [otpLoading, setOtpLoading] = useState(false)
  
  // Errors
  const [errors, setErrors] = useState<FormErrors>({})

  // ============================================
  // Block timer effect
  // ============================================
  useEffect(() => {
    if (blockTimer > 0) {
      const timer = setInterval(() => {
        setBlockTimer((prev) => {
          if (prev <= 1) {
            setIsBlocked(false)
            setOtpAttempts(0)
            return 0
          }
          return prev - 1
        })
      }, 1000)
      return () => clearInterval(timer)
    }
  }, [blockTimer])

  // ============================================
  // Validation Functions
  // ============================================
  const validateEmail = (value: string): string | undefined => {
    if (!value) return 'ایمیل الزامی است'
    if (!EMAIL_REGEX.test(value)) return 'فرمت ایمیل نامعتبر است'
    return undefined
  }

  const validatePassword = (value: string): string | undefined => {
    if (!value) return 'رمز عبور الزامی است'
    if (value.length < 6) return 'رمز عبور باید حداقل 6 کاراکتر باشد'
    return undefined
  }

  const validatePhone = (value: string): string | undefined => {
    if (!value) return 'شماره موبایل الزامی است'
    if (!PHONE_REGEX.test(value)) return 'شماره موبایل نامعتبر (مثال: 09123456789)'
    return undefined
  }

  const validateOtp = (value: string): string | undefined => {
    if (!value) return 'کد تایید الزامی است'
    if (!OTP_REGEX.test(value)) return 'کد تایید باید 6 رقم باشد'
    return undefined
  }

  // ============================================
  // Email Login Handler
  // ============================================
  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    
    const emailError = validateEmail(email)
    const passwordError = validatePassword(password)
    
    if (emailError || passwordError) {
      setErrors({ email: emailError, password: passwordError })
      return
    }
    
    setErrors({})
    setLoading(true)

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) {
        if (error.message.includes('Invalid login credentials')) {
          toast.error('ایمیل یا رمز عبور اشتباه است')
        } else {
          toast.error(error.message)
        }
        return
      }

      if (data.user) {
        toast.success('خوش آمدید! 👋')
        router.push('/dashboard')
      }
    } catch (error) {
      console.error('Login error:', error)
      toast.error('خطا در ورود. لطفاً دوباره تلاش کنید.')
    } finally {
      setLoading(false)
    }
  }

  // ============================================
  // Send OTP Handler
  // ============================================
  const handleSendOtp = async () => {
    const phoneError = validatePhone(phone)
    if (phoneError) {
      setErrors({ phone: phoneError })
      return
    }

    if (isBlocked) {
      toast.error(`لطفاً ${Math.ceil(blockTimer / 60)} دقیقه صبر کنید`)
      return
    }

    setErrors({})
    setOtpLoading(true)

    try {
      // TODO: Replace with actual API call
      const response = await fetch('/api/auth/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'خطا در ارسال کد')
      }

      setOtpSent(true)
      setCanResend(false)
      setTimerKey((prev) => prev + 1)
      toast.success(`کد تایید به شماره ${phone} ارسال شد`)
    } catch (error) {
      console.error('Send OTP error:', error)
      toast.error(error instanceof Error ? error.message : 'خطا در ارسال کد')
    } finally {
      setOtpLoading(false)
    }
  }

  // ============================================
  // Verify OTP Handler
  // ============================================
  const handleVerifyOtp = async () => {
    const otpError = validateOtp(otp)
    if (otpError) {
      setErrors({ otp: otpError })
      return
    }

    if (isBlocked) {
      toast.error('تلاش‌های زیادی انجام شد. لطفاً صبر کنید.')
      return
    }

    setErrors({})
    setLoading(true)

    try {
      // TODO: Replace with actual API call
      const response = await fetch('/api/auth/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone, otp }),
      })

      const data = await response.json()

      if (!response.ok) {
        // Track failed attempts
        const newAttempts = otpAttempts + 1
        setOtpAttempts(newAttempts)
        
        if (newAttempts >= 3) {
          setIsBlocked(true)
          setBlockTimer(600) // 10 minutes
          toast.error('تلاش‌های زیادی انجام شد. لطفاً 10 دقیقه صبر کنید.')
        } else {
          toast.error(`کد نامعتبر است. ${3 - newAttempts} تلاش باقی‌مانده`)
        }
        
        setOtp('')
        return
      }

      toast.success('ورود موفق! 👋')
      router.push('/dashboard')
    } catch (error) {
      console.error('Verify OTP error:', error)
      toast.error('خطا در تایید کد')
    } finally {
      setLoading(false)
    }
  }

  // ============================================
  // Forgot Password - Email Handler
  // ============================================
  const handleForgotEmail = async () => {
    const emailError = validateEmail(forgotEmail)
    if (emailError) {
      setErrors({ email: emailError })
      return
    }

    setErrors({})
    setLoading(true)

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(forgotEmail, {
        redirectTo: `${window.location.origin}/reset-password`,
      })

      if (error) {
        toast.error(error.message)
        return
      }

      toast.success('لینک بازیابی به ایمیل شما ارسال شد')
      setShowForgotPassword(false)
      resetForgotState()
    } catch (error) {
      console.error('Forgot password error:', error)
      toast.error('خطا در ارسال لینک بازیابی')
    } finally {
      setLoading(false)
    }
  }

  // ============================================
  // Forgot Password - Mobile OTP Handler
  // ============================================
  const handleForgotSendOtp = async () => {
    const phoneError = validatePhone(forgotPhone)
    if (phoneError) {
      setErrors({ phone: phoneError })
      return
    }

    setErrors({})
    setOtpLoading(true)

    try {
      const response = await fetch('/api/auth/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: forgotPhone, type: 'reset' }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'خطا در ارسال کد')
      }

      setForgotOtpSent(true)
      setForgotCanResend(false)
      setForgotTimerKey((prev) => prev + 1)
      setForgotStep('otp')
      toast.success('کد تایید ارسال شد')
    } catch (error) {
      console.error('Forgot send OTP error:', error)
      toast.error(error instanceof Error ? error.message : 'خطا در ارسال کد')
    } finally {
      setOtpLoading(false)
    }
  }

  // ============================================
  // Forgot Password - Verify OTP Handler
  // ============================================
  const handleForgotVerifyOtp = async () => {
    const otpError = validateOtp(forgotOtp)
    if (otpError) {
      setErrors({ otp: otpError })
      return
    }

    setErrors({})
    setLoading(true)

    try {
      const response = await fetch('/api/auth/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: forgotPhone, otp: forgotOtp, type: 'reset' }),
      })

      if (!response.ok) {
        toast.error('کد نامعتبر یا منقضی شده')
        setForgotOtp('')
        return
      }

      setForgotStep('newPassword')
    } catch (error) {
      console.error('Forgot verify OTP error:', error)
      toast.error('خطا در تایید کد')
    } finally {
      setLoading(false)
    }
  }

  // ============================================
  // Reset Password Handler
  // ============================================
  const handleResetPassword = async () => {
    const passwordError = validatePassword(newPassword)
    if (passwordError) {
      setErrors({ newPassword: passwordError })
      return
    }

    if (newPassword !== confirmPassword) {
      setErrors({ confirmPassword: 'رمزهای عبور مطابقت ندارند' })
      return
    }

    setErrors({})
    setLoading(true)

    try {
      const response = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: forgotPhone, password: newPassword }),
      })

      if (!response.ok) {
        toast.error('خطا در تغییر رمز عبور')
        return
      }

      toast.success('رمز عبور با موفقیت تغییر یافت')
      setShowForgotPassword(false)
      resetForgotState()
    } catch (error) {
      console.error('Reset password error:', error)
      toast.error('خطا در تغییر رمز عبور')
    } finally {
      setLoading(false)
    }
  }

  // ============================================
  // Reset Forgot State
  // ============================================
  const resetForgotState = () => {
    setForgotMethod('email')
    setForgotStep('input')
    setForgotEmail('')
    setForgotPhone('')
    setForgotOtp('')
    setNewPassword('')
    setConfirmPassword('')
    setForgotOtpSent(false)
    setErrors({})
  }

  // Timer complete callback
  const handleTimerComplete = useCallback(() => setCanResend(true), [])
  const handleForgotTimerComplete = useCallback(() => setForgotCanResend(true), [])

  // ============================================
  // Render
  // ============================================
  return (
    <div
      className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900/50 to-purple-900/30 flex items-center justify-center p-4"
      dir="rtl"
    >
      {/* Background Effects */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl" />
      </div>

      <div className="relative z-10 w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl shadow-lg shadow-blue-500/30 mb-4">
            <GraduationCap className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">
            ورود به هوشاگر
          </h1>
          <p className="text-white/60">
            سیستم مدیریت هوشمند مدارس
          </p>
        </div>

        {/* Login Card */}
        <div className="bg-white/10 backdrop-blur-xl rounded-3xl p-8 border border-white/20 shadow-2xl">
          <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as LoginMethod)}>
            <TabsList className="grid w-full grid-cols-2 bg-white/10 rounded-xl p-1 mb-6">
              <TabsTrigger
                value="email"
                className="flex items-center gap-2 rounded-lg data-[state=active]:bg-white/20 data-[state=active]:text-white text-white/60 transition-all"
              >
                <Mail className="w-4 h-4" />
                ورود با ایمیل
              </TabsTrigger>
              <TabsTrigger
                value="mobile"
                className="flex items-center gap-2 rounded-lg data-[state=active]:bg-white/20 data-[state=active]:text-white text-white/60 transition-all"
              >
                <Phone className="w-4 h-4" />
                ورود با موبایل
              </TabsTrigger>
            </TabsList>

            {/* ═══════════════════════════════════════ */}
            {/* Tab 1: Email Login */}
            {/* ═══════════════════════════════════════ */}
            <TabsContent value="email" className="space-y-4">
              <form onSubmit={handleEmailLogin} className="space-y-4">
                {/* Email Input */}
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-white/80">
                    ایمیل
                  </Label>
                  <div className="relative">
                    <Mail className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-white/40" />
                    <Input
                      id="email"
                      type="email"
                      placeholder="example@email.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="pr-11 bg-white/10 border-white/20 text-white placeholder:text-white/40 focus:border-blue-400 h-12"
                      dir="ltr"
                      aria-describedby={errors.email ? 'email-error' : undefined}
                    />
                  </div>
                  {errors.email && (
                    <p id="email-error" className="text-red-400 text-sm flex items-center gap-1">
                      <AlertCircle className="w-4 h-4" />
                      {errors.email}
                    </p>
                  )}
                </div>

                {/* Password Input */}
                <div className="space-y-2">
                  <Label htmlFor="password" className="text-white/80">
                    رمز عبور
                  </Label>
                  <div className="relative">
                    <Lock className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-white/40" />
                    <Input
                      id="password"
                      type={showPassword ? 'text' : 'password'}
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="pr-11 pl-11 bg-white/10 border-white/20 text-white placeholder:text-white/40 focus:border-blue-400 h-12"
                      dir="ltr"
                      aria-describedby={errors.password ? 'password-error' : undefined}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white/60"
                      aria-label={showPassword ? 'مخفی کردن رمز' : 'نمایش رمز'}
                    >
                      {showPassword ? (
                        <EyeOff className="w-5 h-5" />
                      ) : (
                        <Eye className="w-5 h-5" />
                      )}
                    </button>
                  </div>
                  {errors.password && (
                    <p id="password-error" className="text-red-400 text-sm flex items-center gap-1">
                      <AlertCircle className="w-4 h-4" />
                      {errors.password}
                    </p>
                  )}
                </div>

                {/* Remember & Forgot */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Checkbox
                      id="remember"
                      checked={rememberMe}
                      onCheckedChange={(checked) => setRememberMe(checked as boolean)}
                      className="border-white/40 data-[state=checked]:bg-blue-500"
                    />
                    <Label htmlFor="remember" className="text-white/60 text-sm cursor-pointer">
                      مرا به خاطر بسپار
                    </Label>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowForgotPassword(true)}
                    className="text-blue-400 hover:text-blue-300 text-sm transition-colors"
                  >
                    فراموشی رمز؟
                  </button>
                </div>

                {/* Submit Button */}
                <Button
                  type="submit"
                  disabled={loading}
                  className="w-full h-12 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white font-bold rounded-xl shadow-lg shadow-blue-500/30"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin ml-2" />
                      در حال ورود...
                    </>
                  ) : (
                    <>
                      <ArrowRight className="w-5 h-5 ml-2" />
                      ورود
                    </>
                  )}
                </Button>
              </form>
            </TabsContent>

            {/* ═══════════════════════════════════════ */}
            {/* Tab 2: Mobile Login */}
            {/* ═══════════════════════════════════════ */}
            <TabsContent value="mobile" className="space-y-4">
              {!otpSent ? (
                // Step 1: Phone Input
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="phone" className="text-white/80">
                      شماره موبایل
                    </Label>
                    <div className="relative">
                      <Phone className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-white/40" />
                      <Input
                        id="phone"
                        type="tel"
                        placeholder="09123456789"
                        value={phone}
                        onChange={(e) => {
                          const value = e.target.value.replace(/\D/g, '').slice(0, 11)
                          setPhone(value)
                        }}
                        className="pr-11 bg-white/10 border-white/20 text-white placeholder:text-white/40 focus:border-blue-400 h-12 font-mono"
                        dir="ltr"
                        maxLength={11}
                        aria-describedby={errors.phone ? 'phone-error' : undefined}
                      />
                    </div>
                    {errors.phone && (
                      <p id="phone-error" className="text-red-400 text-sm flex items-center gap-1">
                        <AlertCircle className="w-4 h-4" />
                        {errors.phone}
                      </p>
                    )}
                  </div>

                  {isBlocked && (
                    <div className="bg-red-500/20 border border-red-500/30 rounded-xl p-3 text-center">
                      <p className="text-red-400 text-sm">
                        تلاش‌های زیادی انجام شد. لطفاً{' '}
                        <span className="font-mono">{Math.ceil(blockTimer / 60)}</span>{' '}
                        دقیقه صبر کنید.
                      </p>
                    </div>
                  )}

                  <Button
                    onClick={handleSendOtp}
                    disabled={otpLoading || !PHONE_REGEX.test(phone) || isBlocked}
                    className="w-full h-12 bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white font-bold rounded-xl shadow-lg shadow-blue-500/30"
                  >
                    {otpLoading ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin ml-2" />
                        در حال ارسال...
                      </>
                    ) : (
                      <>
                        <Shield className="w-5 h-5 ml-2" />
                        دریافت کد تایید
                      </>
                    )}
                  </Button>
                </div>
              ) : (
                // Step 2: OTP Input
                <div className="space-y-6">
                  <div className="text-center">
                    <p className="text-white/80 mb-2">
                      کد تایید 6 رقمی را وارد کنید
                    </p>
                    <p className="text-white/50 text-sm">
                      ارسال شده به {phone}
                    </p>
                  </div>

                  <OTPInput
                    value={otp}
                    onChange={setOtp}
                    disabled={loading || isBlocked}
                  />

                  {errors.otp && (
                    <p className="text-red-400 text-sm text-center flex items-center justify-center gap-1">
                      <AlertCircle className="w-4 h-4" />
                      {errors.otp}
                    </p>
                  )}

                  {/* Timer & Resend */}
                  <div className="text-center">
                    {!canResend ? (
                      <p className="text-white/60 text-sm">
                        ارسال مجدد کد:{' '}
                        <CountdownTimer
                          key={timerKey}
                          seconds={120}
                          onComplete={handleTimerComplete}
                        />
                      </p>
                    ) : (
                      <button
                        onClick={() => {
                          setOtp('')
                          handleSendOtp()
                        }}
                        className="text-blue-400 hover:text-blue-300 text-sm transition-colors"
                      >
                        ارسال مجدد کد
                      </button>
                    )}
                  </div>

                  {/* Verify Button */}
                  <Button
                    onClick={handleVerifyOtp}
                    disabled={loading || otp.length !== 6 || isBlocked}
                    className="w-full h-12 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white font-bold rounded-xl shadow-lg shadow-green-500/30"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin ml-2" />
                        در حال تایید...
                      </>
                    ) : (
                      <>
                        <CheckCircle2 className="w-5 h-5 ml-2" />
                        تایید و ورود
                      </>
                    )}
                  </Button>

                  {/* Back Button */}
                  <button
                    onClick={() => {
                      setOtpSent(false)
                      setOtp('')
                      setErrors({})
                    }}
                    className="w-full text-white/50 hover:text-white/70 text-sm transition-colors"
                  >
                    تغییر شماره موبایل
                  </button>
                </div>
              )}
            </TabsContent>
          </Tabs>

          {/* Divider */}
          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-white/20" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="bg-transparent px-4 text-white/40">
                حساب کاربری ندارید؟
              </span>
            </div>
          </div>

          {/* Register Link */}
          <Link
            href="/register"
            className="flex items-center justify-center gap-2 w-full h-12 bg-white/10 hover:bg-white/20 text-white font-medium rounded-xl border border-white/20 transition-all"
          >
            <Sparkles className="w-5 h-5" />
            ثبت‌نام در هوشاگر
          </Link>
        </div>

        {/* Footer */}
        <p className="text-center text-white/40 text-sm mt-6">
          با ورود، قوانین و مقررات هوشاگر را می‌پذیرید
        </p>
      </div>

      {/* ═══════════════════════════════════════ */}
      {/* Forgot Password Dialog */}
      {/* ═══════════════════════════════════════ */}
      <Dialog open={showForgotPassword} onOpenChange={(open) => {
        setShowForgotPassword(open)
        if (!open) resetForgotState()
      }}>
        <DialogContent className="bg-slate-900/95 backdrop-blur-xl border-white/20 text-white max-w-md" dir="rtl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-xl">
              <Key className="w-5 h-5 text-blue-400" />
              بازیابی رمز عبور
            </DialogTitle>
            <DialogDescription className="text-white/60">
              {forgotStep === 'input' && 'روش بازیابی رمز عبور را انتخاب کنید'}
              {forgotStep === 'otp' && 'کد تایید ارسال شده را وارد کنید'}
              {forgotStep === 'newPassword' && 'رمز عبور جدید خود را وارد کنید'}
            </DialogDescription>
          </DialogHeader>

          <Tabs
            value={forgotMethod}
            onValueChange={(v) => {
              setForgotMethod(v as ForgotMethod)
              setForgotStep('input')
              setErrors({})
            }}
            className="mt-4"
          >
            {forgotStep === 'input' && (
              <TabsList className="grid w-full grid-cols-2 bg-white/10 rounded-xl p-1 mb-4">
                <TabsTrigger
                  value="email"
                  className="rounded-lg data-[state=active]:bg-white/20 data-[state=active]:text-white text-white/60"
                >
                  <Mail className="w-4 h-4 ml-2" />
                  با ایمیل
                </TabsTrigger>
                <TabsTrigger
                  value="mobile"
                  className="rounded-lg data-[state=active]:bg-white/20 data-[state=active]:text-white text-white/60"
                >
                  <Phone className="w-4 h-4 ml-2" />
                  با موبایل
                </TabsTrigger>
              </TabsList>
            )}

            {/* Forgot - Email */}
            <TabsContent value="email" className="space-y-4">
              <div className="space-y-2">
                <Label className="text-white/80">ایمیل</Label>
                <div className="relative">
                  <Mail className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-white/40" />
                  <Input
                    type="email"
                    placeholder="example@email.com"
                    value={forgotEmail}
                    onChange={(e) => setForgotEmail(e.target.value)}
                    className="pr-11 bg-white/10 border-white/20 text-white placeholder:text-white/40 h-12"
                    dir="ltr"
                  />
                </div>
                {errors.email && (
                  <p className="text-red-400 text-sm">{errors.email}</p>
                )}
              </div>

              <Button
                onClick={handleForgotEmail}
                disabled={loading}
                className="w-full h-12 bg-gradient-to-r from-blue-500 to-purple-600"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin ml-2" />
                    در حال ارسال...
                  </>
                ) : (
                  'ارسال لینک بازیابی'
                )}
              </Button>
            </TabsContent>

            {/* Forgot - Mobile */}
            <TabsContent value="mobile" className="space-y-4">
              {forgotStep === 'input' && (
                <>
                  <div className="space-y-2">
                    <Label className="text-white/80">شماره موبایل</Label>
                    <div className="relative">
                      <Phone className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-white/40" />
                      <Input
                        type="tel"
                        placeholder="09123456789"
                        value={forgotPhone}
                        onChange={(e) => {
                          const value = e.target.value.replace(/\D/g, '').slice(0, 11)
                          setForgotPhone(value)
                        }}
                        className="pr-11 bg-white/10 border-white/20 text-white placeholder:text-white/40 h-12 font-mono"
                        dir="ltr"
                        maxLength={11}
                      />
                    </div>
                    {errors.phone && (
                      <p className="text-red-400 text-sm">{errors.phone}</p>
                    )}
                  </div>

                  <Button
                    onClick={handleForgotSendOtp}
                    disabled={otpLoading || !PHONE_REGEX.test(forgotPhone)}
                    className="w-full h-12 bg-gradient-to-r from-blue-500 to-cyan-500"
                  >
                    {otpLoading ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin ml-2" />
                        در حال ارسال...
                      </>
                    ) : (
                      'دریافت کد تایید'
                    )}
                  </Button>
                </>
              )}

              {forgotStep === 'otp' && (
                <>
                  <div className="text-center mb-4">
                    <p className="text-white/60 text-sm">
                      کد ارسال شده به {forgotPhone}
                    </p>
                  </div>

                  <OTPInput
                    value={forgotOtp}
                    onChange={setForgotOtp}
                    disabled={loading}
                  />

                  <div className="text-center">
                    {!forgotCanResend ? (
                      <p className="text-white/60 text-sm">
                        ارسال مجدد:{' '}
                        <CountdownTimer
                          key={forgotTimerKey}
                          seconds={120}
                          onComplete={handleForgotTimerComplete}
                        />
                      </p>
                    ) : (
                      <button
                        onClick={() => {
                          setForgotOtp('')
                          handleForgotSendOtp()
                        }}
                        className="text-blue-400 hover:text-blue-300 text-sm"
                      >
                        ارسال مجدد کد
                      </button>
                    )}
                  </div>

                  <Button
                    onClick={handleForgotVerifyOtp}
                    disabled={loading || forgotOtp.length !== 6}
                    className="w-full h-12 bg-gradient-to-r from-green-500 to-emerald-600"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin ml-2" />
                        در حال تایید...
                      </>
                    ) : (
                      'تایید کد'
                    )}
                  </Button>
                </>
              )}

              {forgotStep === 'newPassword' && (
                <>
                  <div className="space-y-2">
                    <Label className="text-white/80">رمز عبور جدید</Label>
                    <div className="relative">
                      <Lock className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-white/40" />
                      <Input
                        type="password"
                        placeholder="••••••••"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        className="pr-11 bg-white/10 border-white/20 text-white placeholder:text-white/40 h-12"
                        dir="ltr"
                      />
                    </div>
                    <PasswordStrength password={newPassword} />
                    {errors.newPassword && (
                      <p className="text-red-400 text-sm">{errors.newPassword}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label className="text-white/80">تکرار رمز عبور</Label>
                    <div className="relative">
                      <Lock className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-white/40" />
                      <Input
                        type="password"
                        placeholder="••••••••"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        className="pr-11 bg-white/10 border-white/20 text-white placeholder:text-white/40 h-12"
                        dir="ltr"
                      />
                    </div>
                    {confirmPassword && newPassword !== confirmPassword && (
                      <p className="text-red-400 text-sm">رمزها مطابقت ندارند</p>
                    )}
                    {errors.confirmPassword && (
                      <p className="text-red-400 text-sm">{errors.confirmPassword}</p>
                    )}
                  </div>

                  <Button
                    onClick={handleResetPassword}
                    disabled={loading || !newPassword || newPassword !== confirmPassword}
                    className="w-full h-12 bg-gradient-to-r from-green-500 to-emerald-600"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin ml-2" />
                        در حال تغییر...
                      </>
                    ) : (
                      'تغییر رمز عبور'
                    )}
                  </Button>
                </>
              )}
            </TabsContent>
          </Tabs>
        </DialogContent>
      </Dialog>
    </div>
  )
}









