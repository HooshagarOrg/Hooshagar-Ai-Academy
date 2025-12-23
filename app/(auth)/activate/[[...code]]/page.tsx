'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import { ValidateCodeResponse } from '@/types/auth'

export default function ActivatePage() {
  const router = useRouter()
  const params = useParams()
  const codeFromUrl = (params.code?.[0] || '').toUpperCase()
  
  const [step, setStep] = useState<'code' | 'form' | 'success'>('code')
  const [loading, setLoading] = useState(false)
  
  const [code, setCode] = useState(codeFromUrl)
  const [codeInfo, setCodeInfo] = useState<ValidateCodeResponse | null>(null)
  
  const [phone, setPhone] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [acceptTerms, setAcceptTerms] = useState(false)
  
  useEffect(() => {
    if (codeFromUrl) {
      validateCode(codeFromUrl)
    }
  }, [codeFromUrl])
  
  const validateCode = async (codeToValidate: string) => {
    setLoading(true)
    
    try {
      const res = await fetch('/api/auth/validate-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: codeToValidate }),
      })
      
      const data: ValidateCodeResponse = await res.json()
      
      if (data.valid) {
        setCodeInfo(data)
        setStep('form')
      } else {
        alert(data.error || 'کد نامعتبر است')
      }
    } catch (error) {
      alert('خطا در ارتباط با سرور')
    } finally {
      setLoading(false)
    }
  }
  
  const handleCodeSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (code.trim()) {
      validateCode(code)
    }
  }
  
  const handleActivate = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (password !== confirmPassword) {
      alert('رمز عبور و تکرار آن یکسان نیستند')
      return
    }
    
    if (password.length < 8) {
      alert('رمز عبور باید حداقل ۸ کاراکتر باشد')
      return
    }
    
    if (!acceptTerms) {
      alert('لطفاً شرایط استفاده را بپذیرید')
      return
    }
    
    setLoading(true)
    
    try {
      const res = await fetch('/api/auth/activate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code,
          phone,
          password,
        }),
      })
      
      const data = await res.json()
      
      if (data.success) {
        setStep('success')
      } else {
        alert(data.error || 'خطا در فعال‌سازی')
      }
    } catch (error) {
      alert('خطا در ارتباط با سرور')
    } finally {
      setLoading(false)
    }
  }
  
  const getRoleName = (role: string, relation?: string) => {
    const roles: Record<string, string> = {
      parent: relation === 'father' ? 'پدر' : relation === 'mother' ? 'مادر' : 'ولی',
      student: 'دانش‌آموز',
      teacher: 'معلم',
      admin: 'مدیر سیستم',
      principal: 'مدیر مدرسه',
      assistant: 'معاون',
      counselor: 'مشاور',
      financial_vp: 'معاون مالی',
    }
    return roles[role] || role
  }
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-teal-50 flex items-center justify-center p-4" dir="rtl">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-8">
        <div className="text-center mb-8">
          <div className="text-6xl mb-4">🎓</div>
          <h1 className="text-3xl font-bold text-gray-800">فعال‌سازی حساب</h1>
          <p className="text-gray-600 mt-2">سیستم هوشگر</p>
        </div>
        
        {/* مرحله ۱: ورود کد */}
        {step === 'code' && (
          <form onSubmit={handleCodeSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                کد فعال‌سازی
              </label>
              <input
                type="text"
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase())}
                placeholder="XXXX-XXXX"
                className="w-full text-center text-2xl tracking-widest font-mono border-2 border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                maxLength={9}
                required
              />
              <p className="text-sm text-gray-500 text-center mt-2">
                کد را از کارت فعال‌سازی خود وارد کنید
              </p>
            </div>
            
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-bold py-3 rounded-lg disabled:opacity-50"
            >
              {loading ? 'در حال بررسی...' : 'بررسی کد'}
            </button>
          </form>
        )}
        
        {/* مرحله ۲: فرم فعال‌سازی */}
        {step === 'form' && codeInfo && (
          <form onSubmit={handleActivate} className="space-y-6">
            <div className="bg-emerald-50 border-2 border-emerald-200 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-emerald-600 text-xl">✅</span>
                <span className="font-bold text-emerald-800">کد معتبر است!</span>
              </div>
              <div className="text-sm text-emerald-700 space-y-1">
                <p>👤 این حساب برای: <strong>{getRoleName(codeInfo.target_role!, codeInfo.relation_type)}</strong></p>
                {codeInfo.student_name && <p>👦 دانش‌آموز: {codeInfo.student_name}</p>}
                {codeInfo.grade && <p>📚 پایه: {codeInfo.grade}</p>}
                <p>🏫 مدرسه: {codeInfo.school_name}</p>
              </div>
              <p className="text-xs text-emerald-600 mt-2">
                🔒 نقش قابل تغییر نیست
              </p>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                📱 شماره موبایل
              </label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="۰۹۱۲۳۴۵۶۷۸۹"
                className="w-full border-2 border-gray-300 rounded-lg px-4 py-3 text-left focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                required
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                🔒 رمز عبور
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="حداقل ۸ کاراکتر"
                className="w-full border-2 border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                required
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                🔒 تکرار رمز عبور
              </label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="تکرار رمز عبور"
                className="w-full border-2 border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                required
              />
            </div>
            
            <div className="flex items-start gap-2">
              <input
                type="checkbox"
                id="terms"
                checked={acceptTerms}
                onChange={(e) => setAcceptTerms(e.target.checked)}
                className="mt-1 w-4 h-4 text-emerald-600 border-gray-300 rounded focus:ring-emerald-500"
              />
              <label htmlFor="terms" className="text-sm text-gray-600">
                <Link href="/terms" target="_blank" className="text-emerald-600 hover:underline">
                  شرایط استفاده و حریم خصوصی
                </Link>
                {' '}را مطالعه کرده و می‌پذیرم
              </label>
            </div>
            
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-bold py-3 rounded-lg disabled:opacity-50"
            >
              {loading ? 'در حال فعال‌سازی...' : '🚀 فعال‌سازی حساب'}
            </button>
          </form>
        )}
        
        {/* مرحله ۳: موفقیت */}
        {step === 'success' && (
          <div className="text-center space-y-6">
            <div className="text-6xl">✨</div>
            <h2 className="text-2xl font-bold text-emerald-700">تبریک!</h2>
            <p className="text-gray-600">حساب شما با موفقیت فعال شد</p>
            
            <div className="bg-gray-50 rounded-lg p-4 text-sm text-right">
              <p className="font-medium mb-2">🎯 اکنون می‌توانید:</p>
              <ul className="space-y-1 text-gray-600">
                <li>• از ابزارهای هوشمند استفاده کنید</li>
                <li>• پیشرفت تحصیلی را پیگیری کنید</li>
                <li>• با مدرسه ارتباط بگیرید</li>
              </ul>
            </div>
            
            <button
              onClick={() => router.push('/login')}
              className="w-full bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-bold py-3 rounded-lg"
            >
              🏠 رفتن به صفحه ورود
            </button>
          </div>
        )}
        
        <div className="mt-8 pt-6 border-t text-center">
          <Link
            href="/help"
            className="text-sm text-gray-500 hover:text-gray-700"
          >
            ❓ مشکل دارید؟ راهنما و پشتیبانی
          </Link>
        </div>
      </div>
    </div>
  )
}

