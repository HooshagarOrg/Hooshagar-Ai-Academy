'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Lock, Eye, EyeOff, Loader2, CheckCircle2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'

const passwordRules = [
  { id: 'length', label: 'حداقل ۸ کاراکتر', test: (p: string) => p.length >= 8 },
  { id: 'upper', label: 'حداقل یک حرف بزرگ', test: (p: string) => /[A-Z]/.test(p) },
  { id: 'lower', label: 'حداقل یک حرف کوچک', test: (p: string) => /[a-z]/.test(p) },
  { id: 'number', label: 'حداقل یک عدد', test: (p: string) => /[0-9]/.test(p) },
]

export default function ChangePasswordPage() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [showNew, setShowNew] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')

  const allRulesMet = passwordRules.every(r => r.test(newPassword))
  const passwordsMatch = newPassword === confirmPassword && confirmPassword.length > 0

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
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
      const data = await response.json()

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
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center p-4" dir="rtl">
      <div className="w-full max-w-md">
        <Card className="shadow-xl border-0 bg-white/80 backdrop-blur-sm">
          <CardHeader className="text-center pb-2">
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br from-amber-500 to-orange-500 mb-4 mx-auto shadow-lg">
              <Lock className="w-7 h-7 text-white" />
            </div>
            <CardTitle className="text-xl">تغییر رمز عبور</CardTitle>
            <CardDescription>
              برای امنیت حساب شما، لطفاً یک رمز عبور جدید انتخاب کنید
            </CardDescription>
          </CardHeader>

          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-5">

              {/* رمز جدید */}
              <div className="space-y-2">
                <Label htmlFor="new-password">رمز عبور جدید</Label>
                <div className="relative">
                  <Input
                    id="new-password"
                    type={showNew ? 'text' : 'password'}
                    value={newPassword}
                    onChange={e => setNewPassword(e.target.value)}
                    placeholder="رمز عبور جدید"
                    required
                    disabled={isLoading}
                    className="text-left pl-10"
                    dir="ltr"
                    autoComplete="new-password"
                  />
                  <button
                    type="button"
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                    onClick={() => setShowNew(!showNew)}
                    tabIndex={-1}
                  >
                    {showNew ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* قوانین رمز */}
              {newPassword.length > 0 && (
                <div className="grid grid-cols-2 gap-2">
                  {passwordRules.map(rule => (
                    <div
                      key={rule.id}
                      className={`flex items-center gap-1.5 text-xs transition-colors ${
                        rule.test(newPassword) ? 'text-green-600' : 'text-muted-foreground'
                      }`}
                    >
                      <CheckCircle2 className={`w-3.5 h-3.5 ${rule.test(newPassword) ? 'fill-green-100' : ''}`} />
                      {rule.label}
                    </div>
                  ))}
                </div>
              )}

              {/* تکرار رمز */}
              <div className="space-y-2">
                <Label htmlFor="confirm-password">تکرار رمز عبور</Label>
                <div className="relative">
                  <Input
                    id="confirm-password"
                    type={showConfirm ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={e => setConfirmPassword(e.target.value)}
                    placeholder="رمز عبور را مجدداً وارد کنید"
                    required
                    disabled={isLoading}
                    className={`text-left pl-10 ${
                      confirmPassword.length > 0
                        ? passwordsMatch ? 'border-green-500' : 'border-red-400'
                        : ''
                    }`}
                    dir="ltr"
                    autoComplete="new-password"
                  />
                  <button
                    type="button"
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                    onClick={() => setShowConfirm(!showConfirm)}
                    tabIndex={-1}
                  >
                    {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {confirmPassword.length > 0 && !passwordsMatch && (
                  <p className="text-xs text-red-500">رمزهای وارد شده یکسان نیستند</p>
                )}
              </div>

              <Button
                type="submit"
                className="w-full bg-gradient-to-r from-blue-600 to-purple-600"
                disabled={isLoading || !allRulesMet || !passwordsMatch}
              >
                {isLoading
                  ? <><Loader2 className="ml-2 h-4 w-4 animate-spin" />در حال ذخیره...</>
                  : 'ذخیره رمز عبور جدید'}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
