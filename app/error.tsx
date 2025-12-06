'use client'

import { useEffect } from 'react'
import Link from 'next/link'
import {
  AlertTriangle,
  RefreshCw,
  Home,
  Bug,
  HelpCircle,
  ChevronDown,
  ChevronUp,
  Copy,
  CheckCircle2,
} from 'lucide-react'
import { useState } from 'react'

// ============================================
// تایپ‌ها
// ============================================
interface ErrorProps {
  error: Error & { digest?: string }
  reset: () => void
}

// ============================================
// کامپوننت Error Boundary
// ============================================
export default function Error({ error, reset }: ErrorProps) {
  const [showDetails, setShowDetails] = useState(false)
  const [copied, setCopied] = useState(false)
  const isDevelopment = process.env.NODE_ENV === 'development'

  // لاگ خطا در development
  useEffect(() => {
    if (isDevelopment) {
      console.error('🔴 Error caught by Error Boundary:', error)
      console.error('Error name:', error.name)
      console.error('Error message:', error.message)
      console.error('Error stack:', error.stack)
      if (error.digest) {
        console.error('Error digest:', error.digest)
      }
    }

    // در production می‌توانید به سرویس مانیتورینگ ارسال کنید
    // مثال: Sentry.captureException(error)
  }, [error, isDevelopment])

  // کپی جزئیات خطا
  const copyErrorDetails = async (): Promise<void> => {
    const details = `
خطا: ${error.name}
پیام: ${error.message}
${error.digest ? `Digest: ${error.digest}` : ''}
زمان: ${new Date().toLocaleString('fa-IR')}
URL: ${typeof window !== 'undefined' ? window.location.href : 'N/A'}
    `.trim()

    await navigator.clipboard.writeText(details)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div 
      className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900/30 to-slate-900 flex items-center justify-center p-4"
      dir="rtl"
    >
      <div className="max-w-lg w-full">
        {/* کارت اصلی */}
        <div className="bg-white/10 backdrop-blur-lg rounded-3xl p-8 border border-white/20 shadow-2xl">
          {/* آیکون و عنوان */}
          <div className="text-center mb-8">
            <div className="relative inline-block">
              <div className="w-24 h-24 bg-gradient-to-br from-red-500 to-orange-500 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg shadow-red-500/30">
                <AlertTriangle className="w-12 h-12 text-white" />
              </div>
              {/* پالس انیمیشن */}
              <div className="absolute inset-0 w-24 h-24 bg-red-500/30 rounded-full animate-ping" />
            </div>
            
            <h1 className="text-2xl md:text-3xl font-bold text-white mb-3">
              اوه! مشکلی پیش آمد 😔
            </h1>
            <p className="text-white/60 leading-relaxed">
              متأسفانه در پردازش درخواست شما خطایی رخ داده است.
              <br />
              نگران نباشید، تیم فنی ما در حال بررسی است.
            </p>
          </div>

          {/* دکمه‌های اصلی */}
          <div className="flex flex-col sm:flex-row gap-3 mb-6">
            <button
              onClick={reset}
              className="flex-1 flex items-center justify-center gap-2 py-4 px-6 bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white font-bold rounded-xl transition-all shadow-lg shadow-blue-500/30 hover:shadow-blue-500/50"
            >
              <RefreshCw className="w-5 h-5" />
              تلاش دوباره
            </button>
            <Link
              href="/"
              className="flex-1 flex items-center justify-center gap-2 py-4 px-6 bg-white/10 hover:bg-white/20 text-white font-bold rounded-xl transition-all border border-white/20"
            >
              <Home className="w-5 h-5" />
              بازگشت به خانه
            </Link>
          </div>

          {/* جزئیات خطا (فقط در development یا با کلیک) */}
          <div className="border-t border-white/10 pt-6">
            <button
              onClick={() => setShowDetails(!showDetails)}
              className="w-full flex items-center justify-between py-2 text-white/50 hover:text-white/70 transition-colors"
            >
              <div className="flex items-center gap-2">
                <Bug className="w-4 h-4" />
                <span className="text-sm">جزئیات فنی</span>
                {isDevelopment && (
                  <span className="bg-yellow-500/20 text-yellow-400 px-2 py-0.5 rounded text-xs">
                    DEV
                  </span>
                )}
              </div>
              {showDetails ? (
                <ChevronUp className="w-4 h-4" />
              ) : (
                <ChevronDown className="w-4 h-4" />
              )}
            </button>

            {showDetails && (
              <div className="mt-4 space-y-3">
                {/* نام خطا */}
                <div className="bg-white/5 rounded-lg p-3">
                  <p className="text-white/40 text-xs mb-1">نوع خطا</p>
                  <p className="text-red-400 font-mono text-sm">{error.name}</p>
                </div>

                {/* پیام خطا */}
                <div className="bg-white/5 rounded-lg p-3">
                  <p className="text-white/40 text-xs mb-1">پیام</p>
                  <p className="text-white/80 font-mono text-sm break-all">
                    {error.message || 'خطای ناشناخته'}
                  </p>
                </div>

                {/* Digest (اگر وجود داشته باشد) */}
                {error.digest && (
                  <div className="bg-white/5 rounded-lg p-3">
                    <p className="text-white/40 text-xs mb-1">شناسه خطا</p>
                    <p className="text-white/60 font-mono text-sm">{error.digest}</p>
                  </div>
                )}

                {/* Stack trace (فقط در development) */}
                {isDevelopment && error.stack && (
                  <div className="bg-white/5 rounded-lg p-3">
                    <p className="text-white/40 text-xs mb-1">Stack Trace</p>
                    <pre className="text-white/60 font-mono text-xs overflow-x-auto max-h-40 overflow-y-auto whitespace-pre-wrap">
                      {error.stack}
                    </pre>
                  </div>
                )}

                {/* دکمه کپی */}
                <button
                  onClick={copyErrorDetails}
                  className="w-full flex items-center justify-center gap-2 py-2 bg-white/5 hover:bg-white/10 text-white/60 rounded-lg transition-all text-sm"
                >
                  {copied ? (
                    <>
                      <CheckCircle2 className="w-4 h-4 text-green-400" />
                      کپی شد!
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4" />
                      کپی جزئیات خطا
                    </>
                  )}
                </button>
              </div>
            )}
          </div>
        </div>

        {/* راهنمای تماس */}
        <div className="mt-6 text-center">
          <div className="inline-flex items-center gap-2 bg-white/5 backdrop-blur rounded-xl px-4 py-3 border border-white/10">
            <HelpCircle className="w-4 h-4 text-blue-400" />
            <span className="text-white/50 text-sm">
              نیاز به کمک دارید؟{' '}
              <a href="mailto:support@hooshagar.ir" className="text-blue-400 hover:underline">
                پشتیبانی
              </a>
            </span>
          </div>
        </div>

        {/* Footer */}
        <p className="text-center text-white/30 text-xs mt-6">
          سیستم هوشمند مدیریت مدارس - هوشاگر
        </p>
      </div>
    </div>
  )
}
















