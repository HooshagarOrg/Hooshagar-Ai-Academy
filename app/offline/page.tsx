'use client'

import { useEffect, useState } from 'react'
import { WifiOff, RefreshCw, Home, ArrowLeft, Cloud, CloudOff, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'

export default function OfflinePage() {
  const [isRetrying, setIsRetrying] = useState(false)
  const [isOnline, setIsOnline] = useState(false)

  useEffect(() => {
    // بررسی وضعیت اتصال
    const handleOnline = () => {
      setIsOnline(true)
      // بعد از 2 ثانیه، ریدایرکت به صفحه قبلی
      setTimeout(() => {
        window.history.back()
      }, 2000)
    }

    const handleOffline = () => {
      setIsOnline(false)
    }

    // بررسی وضعیت اولیه
    setIsOnline(navigator.onLine)

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  const handleRetry = async () => {
    setIsRetrying(true)
    
    try {
      // تست اتصال
      const response = await fetch('/api/health', { 
        method: 'HEAD',
        cache: 'no-cache' 
      })
      
      if (response.ok) {
        window.location.reload()
      } else {
        setIsRetrying(false)
      }
    } catch {
      setIsRetrying(false)
    }
  }

  const handleGoHome = () => {
    window.location.href = '/dashboard'
  }

  const handleGoBack = () => {
    window.history.back()
  }

  // اگر آنلاین شد
  if (isOnline) {
    return (
      <div 
        className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50"
        dir="rtl"
      >
        <div className="text-center p-8 max-w-md">
          <div className="relative">
            <div className="w-32 h-32 mx-auto mb-6 rounded-full bg-green-100 flex items-center justify-center">
              <Cloud className="w-16 h-16 text-green-500 animate-bounce" />
            </div>
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-32 rounded-full bg-green-200 animate-ping opacity-50" />
          </div>
          
          <h1 className="text-3xl font-bold text-green-700 mb-4">
            اتصال برقرار شد! ✅
          </h1>
          
          <p className="text-green-600 mb-6">
            در حال بازگشت به صفحه قبلی...
          </p>
          
          <div className="flex items-center justify-center gap-2 text-green-500">
            <Loader2 className="w-5 h-5 animate-spin" />
            <span>لطفاً صبر کنید</span>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div 
      className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50"
      dir="rtl"
    >
      <div className="text-center p-8 max-w-md">
        {/* آیکون */}
        <div className="relative mb-8">
          <div className="w-32 h-32 mx-auto rounded-full bg-gray-100 flex items-center justify-center">
            <CloudOff className="w-16 h-16 text-gray-400" />
          </div>
          
          {/* انیمیشن پالس */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
            <div className="w-40 h-40 rounded-full border-4 border-gray-200 animate-ping opacity-20" />
          </div>
          
          {/* آیکون Wi-Fi قطع */}
          <div className="absolute -bottom-2 -right-2 w-12 h-12 bg-red-100 rounded-full flex items-center justify-center border-4 border-white">
            <WifiOff className="w-6 h-6 text-red-500" />
          </div>
        </div>
        
        {/* عنوان */}
        <h1 className="text-3xl font-bold text-gray-800 mb-4">
          اتصال اینترنت قطع است
        </h1>
        
        {/* توضیحات */}
        <p className="text-gray-600 mb-8 leading-relaxed">
          لطفاً اتصال اینترنت خود را بررسی کنید.
          <br />
          برخی قابلیت‌ها در حالت آفلاین در دسترس نیستند.
        </p>
        
        {/* دکمه‌ها */}
        <div className="flex flex-col sm:flex-row gap-3 justify-center mb-8">
          <Button
            onClick={handleRetry}
            disabled={isRetrying}
            className="gap-2 bg-blue-500 hover:bg-blue-600"
          >
            {isRetrying ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <RefreshCw className="w-4 h-4" />
            )}
            {isRetrying ? 'در حال بررسی...' : 'تلاش مجدد'}
          </Button>
          
          <Button
            variant="outline"
            onClick={handleGoHome}
            className="gap-2"
          >
            <Home className="w-4 h-4" />
            صفحه اصلی
          </Button>
          
          <Button
            variant="ghost"
            onClick={handleGoBack}
            className="gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            بازگشت
          </Button>
        </div>
        
        {/* راهنما */}
        <div className="bg-white/50 backdrop-blur-sm rounded-xl p-6 text-right">
          <h3 className="font-semibold text-gray-700 mb-3">
            💡 راهنمای رفع مشکل:
          </h3>
          <ul className="text-sm text-gray-600 space-y-2">
            <li className="flex items-start gap-2">
              <span className="text-blue-500 mt-1">•</span>
              <span>اتصال Wi-Fi یا داده موبایل را بررسی کنید</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-blue-500 mt-1">•</span>
              <span>حالت هواپیما را غیرفعال کنید</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-blue-500 mt-1">•</span>
              <span>مودم یا روتر را مجدداً راه‌اندازی کنید</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-blue-500 mt-1">•</span>
              <span>از صفحات ذخیره‌شده (آفلاین) استفاده کنید</span>
            </li>
          </ul>
        </div>
        
        {/* فوتر */}
        <div className="mt-8 text-sm text-gray-400">
          <p>هوشاگر - سیستم مدیریت هوشمند مدارس</p>
        </div>
      </div>
    </div>
  )
}
