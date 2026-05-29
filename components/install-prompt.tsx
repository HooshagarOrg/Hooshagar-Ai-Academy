'use client'

import { useState, useEffect, useCallback } from 'react'
import { X, Download, Smartphone, Share, Plus, Check } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

// ============================================
// تایپ‌ها
// ============================================

interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[]
  readonly userChoice: Promise<{
    outcome: 'accepted' | 'dismissed'
    platform: string
  }>
  prompt(): Promise<void>
}

declare global {
  interface WindowEventMap {
    beforeinstallprompt: BeforeInstallPromptEvent
  }
}

// ============================================
// کامپوننت اصلی
// ============================================

export default function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null)
  const [showPrompt, setShowPrompt] = useState(false)
  const [isIOS, setIsIOS] = useState(false)
  const [isStandalone, setIsStandalone] = useState(false)
  const [isInstalling, setIsInstalling] = useState(false)
  const [isInstalled, setIsInstalled] = useState(false)
  const [showIOSGuide, setShowIOSGuide] = useState(false)

  // ============================================
  // Effects
  // ============================================

  useEffect(() => {
    // بررسی localStorage
    const dismissed = localStorage.getItem('pwa-install-dismissed')
    const installed = localStorage.getItem('pwa-installed')
    
    if (dismissed || installed) {
      return
    }

    // تشخیص iOS
    const userAgent = window.navigator.userAgent.toLowerCase()
    const isIOSDevice =
      /iphone|ipad|ipod/.test(userAgent) &&
      !(window as Window & { MSStream?: unknown }).MSStream
    setIsIOS(isIOSDevice)

    // بررسی standalone mode
    const isInStandalone = 
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as any).standalone === true
    
    setIsStandalone(isInStandalone)

    if (isInStandalone) {
      localStorage.setItem('pwa-installed', 'true')
      return
    }

    // نمایش راهنمای iOS
    if (isIOSDevice && !isInStandalone) {
      const timeout = setTimeout(() => {
        setShowIOSGuide(true)
      }, 15000) // 15 ثانیه بعد از باز شدن
      
      return () => clearTimeout(timeout)
    }

    // برای Android/Desktop - گوش دادن به beforeinstallprompt
    const handleBeforeInstallPrompt = (e: BeforeInstallPromptEvent) => {
      e.preventDefault()
      setDeferredPrompt(e)
      
      // نمایش بعد از 10 ثانیه
      setTimeout(() => {
        setShowPrompt(true)
      }, 10000)
    }

    // گوش دادن به appinstalled
    const handleAppInstalled = () => {
      setIsInstalled(true)
      setDeferredPrompt(null)
      setShowPrompt(false)
      localStorage.setItem('pwa-installed', 'true')
    }

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
    window.addEventListener('appinstalled', handleAppInstalled)

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
      window.removeEventListener('appinstalled', handleAppInstalled)
    }
  }, [])

  // ============================================
  // Handlers
  // ============================================

  const handleInstall = useCallback(async () => {
    if (!deferredPrompt) return

    setIsInstalling(true)

    try {
      await deferredPrompt.prompt()
      const { outcome } = await deferredPrompt.userChoice

      if (outcome === 'accepted') {
        setIsInstalled(true)
        setDeferredPrompt(null)
        setShowPrompt(false)
        localStorage.setItem('pwa-installed', 'true')
      }
    } catch (error) {
      console.error('Install error:', error)
    } finally {
      setIsInstalling(false)
    }
  }, [deferredPrompt])

  const handleDismiss = useCallback(() => {
    setShowPrompt(false)
    setShowIOSGuide(false)
    // ذخیره برای 7 روز
    localStorage.setItem('pwa-install-dismissed', Date.now().toString())
  }, [])

  const handleDismissPermanent = useCallback(() => {
    setShowPrompt(false)
    setShowIOSGuide(false)
    localStorage.setItem('pwa-install-dismissed', 'permanent')
  }, [])

  // ============================================
  // بررسی dismiss قبلی
  // ============================================

  useEffect(() => {
    const dismissed = localStorage.getItem('pwa-install-dismissed')
    
    if (dismissed === 'permanent') {
      return
    }
    
    if (dismissed) {
      const dismissedTime = parseInt(dismissed)
      const sevenDays = 7 * 24 * 60 * 60 * 1000
      
      if (Date.now() - dismissedTime < sevenDays) {
        return
      }
      
      // بعد از 7 روز، پاک کن
      localStorage.removeItem('pwa-install-dismissed')
    }
  }, [])

  // ============================================
  // نمایش موفقیت نصب
  // ============================================

  if (isInstalled) {
    return (
      <div className="fixed bottom-4 left-4 right-4 z-50 max-w-md mx-auto animate-slide-up">
        <div className="bg-green-50 border border-green-200 rounded-xl shadow-lg p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center flex-shrink-0">
              <Check className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="font-bold text-green-800">
                نصب شد! ✅
              </h3>
              <p className="text-sm text-green-600">
                هوشاگر به صفحه اصلی اضافه شد
              </p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // ============================================
  // راهنمای iOS
  // ============================================

  if (isIOS && showIOSGuide && !isStandalone) {
    return (
      <div className="fixed bottom-4 left-4 right-4 z-50 max-w-md mx-auto animate-slide-up" dir="rtl">
        <div className="bg-white border border-gray-200 rounded-xl shadow-xl overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-l from-blue-500 to-purple-500 p-4">
            <button
              onClick={handleDismiss}
              className="absolute top-3 left-3 text-white/80 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>
            
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-white/20 backdrop-blur rounded-xl flex items-center justify-center flex-shrink-0">
                <Smartphone className="w-7 h-7 text-white" />
              </div>
              <div>
                <h3 className="font-bold text-white text-lg">
                  نصب هوشاگر روی آیفون
                </h3>
                <p className="text-white/80 text-sm">
                  دسترسی سریع‌تر و بهتر
                </p>
              </div>
            </div>
          </div>

          {/* Steps */}
          <div className="p-4">
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 text-blue-600 font-bold">
                  ۱
                </div>
                <div className="flex-1">
                  <p className="text-gray-700 font-medium">
                    دکمه Share را بزنید
                  </p>
                  <div className="mt-1 flex items-center gap-2 text-sm text-gray-500">
                    <Share className="w-4 h-4" />
                    <span>در پایین صفحه Safari</span>
                  </div>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 text-blue-600 font-bold">
                  ۲
                </div>
                <div className="flex-1">
                  <p className="text-gray-700 font-medium">
                    "Add to Home Screen" را انتخاب کنید
                  </p>
                  <div className="mt-1 flex items-center gap-2 text-sm text-gray-500">
                    <Plus className="w-4 h-4" />
                    <span>به پایین اسکرول کنید</span>
                  </div>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 text-blue-600 font-bold">
                  ۳
                </div>
                <div className="flex-1">
                  <p className="text-gray-700 font-medium">
                    روی "Add" کلیک کنید
                  </p>
                  <div className="mt-1 text-sm text-gray-500">
                    آیکون هوشاگر به صفحه اصلی اضافه می‌شود
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="px-4 pb-4">
            <button
              onClick={handleDismissPermanent}
              className="w-full text-center text-sm text-gray-400 hover:text-gray-600"
            >
              دیگر نمایش نده
            </button>
          </div>
        </div>
      </div>
    )
  }

  // ============================================
  // Prompt برای Android/Desktop
  // ============================================

  if (!showPrompt || !deferredPrompt) {
    return null
  }

  return (
    <div className="fixed bottom-4 left-4 right-4 z-50 max-w-md mx-auto animate-slide-up" dir="rtl">
      <div className="bg-white border border-gray-200 rounded-xl shadow-xl p-4">
        <button
          onClick={handleDismiss}
          className="absolute top-3 left-3 text-gray-400 hover:text-gray-600"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-4">
          {/* آیکون */}
          <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-purple-500 rounded-xl flex items-center justify-center flex-shrink-0 shadow-lg">
            <Download className="w-7 h-7 text-white" />
          </div>

          {/* محتوا */}
          <div className="flex-1 min-w-0">
            <h3 className="font-bold text-gray-900 mb-1">
              نصب هوشاگر
            </h3>
            <p className="text-sm text-gray-600 mb-3">
              دسترسی سریع‌تر از صفحه اصلی گوشی
            </p>
            
            {/* مزایا */}
            <div className="flex flex-wrap gap-2 text-xs">
              <span className="bg-blue-50 text-blue-600 px-2 py-1 rounded-full">
                ⚡ سریع‌تر
              </span>
              <span className="bg-green-50 text-green-600 px-2 py-1 rounded-full">
                📴 آفلاین
              </span>
              <span className="bg-purple-50 text-purple-600 px-2 py-1 rounded-full">
                🔔 نوتیفیکیشن
              </span>
            </div>
          </div>

          {/* دکمه نصب */}
          <Button
            onClick={handleInstall}
            disabled={isInstalling}
            className={cn(
              "flex-shrink-0 bg-blue-500 hover:bg-blue-600",
              isInstalling && "opacity-50"
            )}
          >
            {isInstalling ? (
              <span className="animate-spin">⏳</span>
            ) : (
              'نصب'
            )}
          </Button>
        </div>

        {/* لینک "دیگر نمایش نده" */}
        <button
          onClick={handleDismissPermanent}
          className="w-full text-center text-xs text-gray-400 hover:text-gray-600 mt-3"
        >
          دیگر نمایش نده
        </button>
      </div>
    </div>
  )
}

// ============================================
// انیمیشن CSS
// ============================================

const styles = `
  @keyframes slide-up {
    from {
      opacity: 0;
      transform: translateY(100%);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }
  
  .animate-slide-up {
    animation: slide-up 0.3s ease-out;
  }
`

// تزریق استایل
if (typeof document !== 'undefined') {
  const styleElement = document.createElement('style')
  styleElement.textContent = styles
  document.head.appendChild(styleElement)
}

// ============================================
// Hook برای استفاده در سایر کامپوننت‌ها
// ============================================

export function useInstallPrompt() {
  const [canInstall, setCanInstall] = useState(false)
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null)

  useEffect(() => {
    const handler = (e: BeforeInstallPromptEvent) => {
      e.preventDefault()
      setDeferredPrompt(e)
      setCanInstall(true)
    }

    window.addEventListener('beforeinstallprompt', handler)

    return () => {
      window.removeEventListener('beforeinstallprompt', handler)
    }
  }, [])

  const install = useCallback(async () => {
    if (!deferredPrompt) return false

    await deferredPrompt.prompt()
    const { outcome } = await deferredPrompt.userChoice

    if (outcome === 'accepted') {
      setCanInstall(false)
      setDeferredPrompt(null)
      return true
    }

    return false
  }, [deferredPrompt])

  return { canInstall, install }
}
