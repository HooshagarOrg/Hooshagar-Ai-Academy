'use client'

import { useEffect, useState, createContext, useContext, ReactNode } from 'react'
import { toast } from 'sonner'

// ============================================
// تایپ‌ها
// ============================================

interface ServiceWorkerContextType {
  isSupported: boolean
  isRegistered: boolean
  isOnline: boolean
  registration: ServiceWorkerRegistration | null
  update: () => Promise<void>
  cleanCache: () => void
}

const ServiceWorkerContext = createContext<ServiceWorkerContextType>({
  isSupported: false,
  isRegistered: false,
  isOnline: true,
  registration: null,
  update: async () => {},
  cleanCache: () => {},
})

// ============================================
// Provider Component
// ============================================

interface ServiceWorkerProviderProps {
  children: ReactNode
}

export function ServiceWorkerProvider({ children }: ServiceWorkerProviderProps) {
  const [isSupported, setIsSupported] = useState(false)
  const [isRegistered, setIsRegistered] = useState(false)
  const [isOnline, setIsOnline] = useState(true)
  const [registration, setRegistration] = useState<ServiceWorkerRegistration | null>(null)
  const [updateAvailable, setUpdateAvailable] = useState(false)

  // ============================================
  // ثبت Service Worker
  // ============================================

  useEffect(() => {
    // چک پشتیبانی
    if (!('serviceWorker' in navigator)) {
      console.log('[PWA] Service Worker not supported')
      return
    }

    setIsSupported(true)

    // ثبت SW
    const registerSW = async () => {
      try {
        const reg = await navigator.serviceWorker.register('/sw.js', {
          scope: '/',
        })

        setRegistration(reg)
        setIsRegistered(true)
        console.log('[PWA] Service Worker registered:', reg.scope)

        // چک بروزرسانی
        reg.addEventListener('updatefound', () => {
          const newWorker = reg.installing
          if (!newWorker) return

          newWorker.addEventListener('statechange', () => {
            if (
              newWorker.state === 'installed' &&
              navigator.serviceWorker.controller
            ) {
              // بروزرسانی در دسترس است
              setUpdateAvailable(true)
              toast('نسخه جدید در دسترس است', {
                action: {
                  label: 'بروزرسانی',
                  onClick: () => {
                    newWorker.postMessage({ type: 'SKIP_WAITING' })
                    window.location.reload()
                  },
                },
                duration: 10000,
              })
            }
          })
        })

        // چک بروزرسانی هر ساعت
        setInterval(() => {
          reg.update()
        }, 60 * 60 * 1000)

      } catch (error) {
        console.error('[PWA] Service Worker registration failed:', error)
      }
    }

    registerSW()

    // وقتی controller عوض شد (بروزرسانی)
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      console.log('[PWA] Controller changed, reloading...')
    })

  }, [])

  // ============================================
  // مدیریت وضعیت آنلاین/آفلاین
  // ============================================

  useEffect(() => {
    setIsOnline(navigator.onLine)

    const handleOnline = () => {
      setIsOnline(true)
      toast.success('اتصال برقرار شد')
      // ذخیره زمان آنلاین شدن
      localStorage.setItem('lastOnlineTime', Date.now().toString())
    }

    const handleOffline = () => {
      setIsOnline(false)
      toast.error('اتصال اینترنت قطع شد')
    }

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  // ============================================
  // متدها
  // ============================================

  const update = async () => {
    if (registration) {
      await registration.update()
      toast.info('در حال بررسی بروزرسانی...')
    }
  }

  const cleanCache = () => {
    if (registration?.active) {
      registration.active.postMessage({ type: 'CLEAN_CACHE' })
      toast.success('حافظه پاکسازی شد')
    }
  }

  // ============================================
  // Context Value
  // ============================================

  const value: ServiceWorkerContextType = {
    isSupported,
    isRegistered,
    isOnline,
    registration,
    update,
    cleanCache,
  }

  return (
    <ServiceWorkerContext.Provider value={value}>
      {children}

      {/* نوار وضعیت آفلاین */}
      {!isOnline && (
        <div className="fixed top-0 left-0 right-0 z-50 bg-orange-500 text-white text-center py-2 text-sm">
          🔌 شما آفلاین هستید - برخی قابلیت‌ها در دسترس نیست
        </div>
      )}
    </ServiceWorkerContext.Provider>
  )
}

// ============================================
// Hook
// ============================================

export function useServiceWorker() {
  return useContext(ServiceWorkerContext)
}

// ============================================
// کامپوننت نمایش وضعیت آنلاین
// ============================================

export function OnlineStatus() {
  const { isOnline } = useServiceWorker()

  return (
    <div className="flex items-center gap-2">
      <div
        className={`w-2 h-2 rounded-full ${
          isOnline ? 'bg-green-500' : 'bg-red-500'
        }`}
      />
      <span className="text-sm text-gray-600">
        {isOnline ? 'آنلاین' : 'آفلاین'}
      </span>
    </div>
  )
}

