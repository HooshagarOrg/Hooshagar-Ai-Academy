'use client'

import { useEffect, useState, createContext, useContext, ReactNode } from 'react'

// ============================================
// تایپ‌ها
// ============================================

interface PWAContextType {
  isInstalled: boolean
  isOnline: boolean
  isUpdateAvailable: boolean
  swRegistration: ServiceWorkerRegistration | null
  updateApp: () => void
  getCacheSize: () => Promise<number>
  clearCache: () => Promise<void>
}

interface PWAProviderProps {
  children: ReactNode
}

// ============================================
// Context
// ============================================

const PWAContext = createContext<PWAContextType | null>(null)

// ============================================
// Provider
// ============================================

export function PWAProvider({ children }: PWAProviderProps) {
  const [isInstalled, setIsInstalled] = useState(false)
  const [isOnline, setIsOnline] = useState(true)
  const [isUpdateAvailable, setIsUpdateAvailable] = useState(false)
  const [swRegistration, setSwRegistration] = useState<ServiceWorkerRegistration | null>(null)
  const [waitingWorker, setWaitingWorker] = useState<ServiceWorker | null>(null)

  // ============================================
  // ثبت Service Worker
  // ============================================

  useEffect(() => {
    // بررسی پشتیبانی
    if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
      console.log('[PWA] Service Worker not supported')
      return
    }

    // بررسی محیط توسعه
    if (process.env.NODE_ENV === 'development') {
      console.log('[PWA] Skipping SW registration in development')
      return
    }

    const registerServiceWorker = async () => {
      try {
        const registration = await navigator.serviceWorker.register('/sw.js', {
          scope: '/',
          updateViaCache: 'none',
        })

        console.log('[PWA] Service Worker registered:', registration.scope)
        setSwRegistration(registration)

        // بررسی بروزرسانی
        registration.addEventListener('updatefound', () => {
          const newWorker = registration.installing
          
          if (newWorker) {
            newWorker.addEventListener('statechange', () => {
              if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                console.log('[PWA] New version available')
                setIsUpdateAvailable(true)
                setWaitingWorker(newWorker)
              }
            })
          }
        })

        // چک بروزرسانی هر 60 دقیقه
        setInterval(() => {
          registration.update()
        }, 60 * 60 * 1000)

      } catch (error) {
        console.error('[PWA] Service Worker registration failed:', error)
      }
    }

    registerServiceWorker()

    // پاکسازی
    return () => {
      // Cleanup if needed
    }
  }, [])

  // ============================================
  // بررسی وضعیت آنلاین
  // ============================================

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true)
      console.log('[PWA] Online')
    }

    const handleOffline = () => {
      setIsOnline(false)
      console.log('[PWA] Offline')
    }

    // وضعیت اولیه
    setIsOnline(navigator.onLine)

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  // ============================================
  // بررسی نصب شده بودن
  // ============================================

  useEffect(() => {
    const checkInstalled = () => {
      const isStandalone = 
        window.matchMedia('(display-mode: standalone)').matches ||
        (window.navigator as any).standalone === true

      setIsInstalled(isStandalone)
    }

    checkInstalled()

    // گوش دادن به تغییرات display-mode
    const mediaQuery = window.matchMedia('(display-mode: standalone)')
    mediaQuery.addEventListener('change', checkInstalled)

    return () => {
      mediaQuery.removeEventListener('change', checkInstalled)
    }
  }, [])

  // ============================================
  // متدها
  // ============================================

  const updateApp = () => {
    if (waitingWorker) {
      // ارسال پیام به SW برای skip waiting
      waitingWorker.postMessage({ type: 'SKIP_WAITING' })
      
      // رفرش صفحه بعد از فعال شدن SW جدید
      navigator.serviceWorker.addEventListener('controllerchange', () => {
        window.location.reload()
      })
    }
  }

  const getCacheSize = async (): Promise<number> => {
    if (!swRegistration?.active) return 0

    return new Promise((resolve) => {
      const messageChannel = new MessageChannel()
      
      messageChannel.port1.onmessage = (event) => {
        resolve(event.data.size || 0)
      }

      swRegistration.active.postMessage(
        { type: 'GET_CACHE_SIZE' },
        [messageChannel.port2]
      )
    })
  }

  const clearCache = async (): Promise<void> => {
    if (swRegistration?.active) {
      swRegistration.active.postMessage({ type: 'CLEAN_CACHE' })
    }

    // پاکسازی تمام cache ها
    const cacheNames = await caches.keys()
    await Promise.all(cacheNames.map((name) => caches.delete(name)))

    console.log('[PWA] Cache cleared')
  }

  // ============================================
  // Render
  // ============================================

  return (
    <PWAContext.Provider
      value={{
        isInstalled,
        isOnline,
        isUpdateAvailable,
        swRegistration,
        updateApp,
        getCacheSize,
        clearCache,
      }}
    >
      {children}
      
      {/* نوار بروزرسانی */}
      {isUpdateAvailable && (
        <div className="fixed top-0 left-0 right-0 z-[100] bg-blue-600 text-white text-center py-2 px-4 text-sm">
          <span className="ml-4">نسخه جدید در دسترس است!</span>
          <button
            onClick={updateApp}
            className="bg-white text-blue-600 px-3 py-1 rounded-md text-xs font-medium hover:bg-blue-50"
          >
            بروزرسانی
          </button>
        </div>
      )}

      {/* نوار آفلاین */}
      {!isOnline && (
        <div className="fixed top-0 left-0 right-0 z-[100] bg-yellow-500 text-yellow-900 text-center py-2 px-4 text-sm">
          📴 اتصال اینترنت قطع است - حالت آفلاین
        </div>
      )}
    </PWAContext.Provider>
  )
}

// ============================================
// Hook
// ============================================

export function usePWA() {
  const context = useContext(PWAContext)
  
  if (!context) {
    throw new Error('usePWA must be used within PWAProvider')
  }
  
  return context
}

// ============================================
// Component برای نمایش وضعیت PWA
// ============================================

export function PWAStatus() {
  const { isInstalled, isOnline, isUpdateAvailable } = usePWA()

  return (
    <div className="flex items-center gap-2 text-sm">
      {/* وضعیت نصب */}
      <span
        className={`px-2 py-1 rounded-full ${
          isInstalled ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'
        }`}
      >
        {isInstalled ? '📱 نصب شده' : '🌐 مرورگر'}
      </span>

      {/* وضعیت اتصال */}
      <span
        className={`px-2 py-1 rounded-full ${
          isOnline ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
        }`}
      >
        {isOnline ? '🟢 آنلاین' : '📴 آفلاین'}
      </span>

      {/* بروزرسانی */}
      {isUpdateAvailable && (
        <span className="px-2 py-1 rounded-full bg-blue-100 text-blue-700 animate-pulse">
          🔄 بروزرسانی
        </span>
      )}
    </div>
  )
}

export default PWAProvider







