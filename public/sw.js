// =====================================================
// هوشاگر - Service Worker
// نسخه: 1.0
// =====================================================

const CACHE_VERSION = 'v1'
const CACHE_NAME = `hooshagar-${CACHE_VERSION}`
const RUNTIME_CACHE = `hooshagar-runtime-${CACHE_VERSION}`
const IMAGE_CACHE = `hooshagar-images-${CACHE_VERSION}`

// فایل‌های استاتیک برای cache اولیه
const STATIC_ASSETS = [
  '/',
  '/login',
  '/dashboard',
  '/offline',
  '/manifest.json',
  '/icons/icon-192x192.png',
  '/icons/icon-512x512.png',
]

// مسیرهای API که باید cache شوند
const API_CACHE_PATHS = [
  '/api/profile',
  '/api/schools',
  '/api/notifications',
]

// حداکثر سن cache (7 روز)
const MAX_CACHE_AGE = 7 * 24 * 60 * 60 * 1000

// =====================================================
// رویداد نصب (Install)
// =====================================================

self.addEventListener('install', (event) => {
  console.log('[SW] Installing Service Worker...')
  
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('[SW] Caching static assets...')
        return cache.addAll(STATIC_ASSETS)
      })
      .then(() => {
        console.log('[SW] Static assets cached successfully')
        return self.skipWaiting()
      })
      .catch((error) => {
        console.error('[SW] Failed to cache static assets:', error)
      })
  )
})

// =====================================================
// رویداد فعال‌سازی (Activate)
// =====================================================

self.addEventListener('activate', (event) => {
  console.log('[SW] Activating Service Worker...')
  
  event.waitUntil(
    caches.keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            // حذف cache های قدیمی
            if (
              cacheName !== CACHE_NAME &&
              cacheName !== RUNTIME_CACHE &&
              cacheName !== IMAGE_CACHE &&
              cacheName.startsWith('hooshagar-')
            ) {
              console.log('[SW] Deleting old cache:', cacheName)
              return caches.delete(cacheName)
            }
          })
        )
      })
      .then(() => {
        console.log('[SW] Service Worker activated')
        return self.clients.claim()
      })
  )
})

// =====================================================
// رویداد Fetch
// =====================================================

self.addEventListener('fetch', (event) => {
  const { request } = event
  const url = new URL(request.url)

  // فقط برای درخواست‌های همان origin
  if (url.origin !== location.origin) {
    return
  }

  // نادیده گرفتن درخواست‌های خاص
  if (
    url.pathname.startsWith('/_next/') ||
    url.pathname.startsWith('/api/auth/') ||
    url.pathname.includes('hot-update') ||
    request.method !== 'GET'
  ) {
    return
  }

  // استراتژی برای API
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(networkFirstStrategy(request))
    return
  }

  // استراتژی برای تصاویر
  if (
    url.pathname.startsWith('/icons/') ||
    url.pathname.startsWith('/images/') ||
    request.destination === 'image'
  ) {
    event.respondWith(cacheFirstStrategy(request, IMAGE_CACHE))
    return
  }

  // استراتژی برای صفحات HTML
  if (request.mode === 'navigate') {
    event.respondWith(networkFirstWithFallback(request))
    return
  }

  // استراتژی پیش‌فرض: Stale While Revalidate
  event.respondWith(staleWhileRevalidate(request))
})

// =====================================================
// استراتژی‌های Cache
// =====================================================

/**
 * Network First: اول شبکه، اگر نبود از cache
 */
async function networkFirstStrategy(request) {
  try {
    const networkResponse = await fetch(request)
    
    // cache کردن پاسخ موفق
    if (networkResponse.ok) {
      const cache = await caches.open(RUNTIME_CACHE)
      cache.put(request, networkResponse.clone())
    }
    
    return networkResponse
  } catch (error) {
    console.log('[SW] Network failed, trying cache:', request.url)
    const cachedResponse = await caches.match(request)
    
    if (cachedResponse) {
      return cachedResponse
    }
    
    // اگر API است، JSON خالی برگردان
    return new Response(
      JSON.stringify({ error: 'آفلاین', offline: true }),
      {
        status: 503,
        headers: { 'Content-Type': 'application/json' }
      }
    )
  }
}

/**
 * Cache First: اول cache، اگر نبود از شبکه
 */
async function cacheFirstStrategy(request, cacheName = RUNTIME_CACHE) {
  const cachedResponse = await caches.match(request)
  
  if (cachedResponse) {
    return cachedResponse
  }
  
  try {
    const networkResponse = await fetch(request)
    
    if (networkResponse.ok) {
      const cache = await caches.open(cacheName)
      cache.put(request, networkResponse.clone())
    }
    
    return networkResponse
  } catch (error) {
    console.log('[SW] Failed to fetch:', request.url)
    return new Response('Resource not available', { status: 404 })
  }
}

/**
 * Network First با Fallback به صفحه آفلاین
 */
async function networkFirstWithFallback(request) {
  try {
    const networkResponse = await fetch(request)
    
    // cache کردن صفحه برای استفاده آفلاین
    if (networkResponse.ok) {
      const cache = await caches.open(RUNTIME_CACHE)
      cache.put(request, networkResponse.clone())
    }
    
    return networkResponse
  } catch (error) {
    console.log('[SW] Navigation failed, trying cache:', request.url)
    
    // تلاش برای پیدا کردن از cache
    const cachedResponse = await caches.match(request)
    if (cachedResponse) {
      return cachedResponse
    }
    
    // نمایش صفحه آفلاین
    const offlinePage = await caches.match('/offline')
    if (offlinePage) {
      return offlinePage
    }
    
    // اگر صفحه آفلاین هم نبود
    return new Response(
      '<html dir="rtl"><body style="font-family:sans-serif;text-align:center;padding:50px;"><h1>اتصال اینترنت قطع است</h1><p>لطفاً اتصال خود را بررسی کنید.</p></body></html>',
      {
        status: 503,
        headers: { 'Content-Type': 'text/html; charset=utf-8' }
      }
    )
  }
}

/**
 * Stale While Revalidate: از cache استفاده کن و در پس‌زمینه بروزرسانی کن
 */
async function staleWhileRevalidate(request) {
  const cachedResponse = await caches.match(request)
  
  // بروزرسانی در پس‌زمینه
  const fetchPromise = fetch(request)
    .then((networkResponse) => {
      if (networkResponse.ok) {
        caches.open(RUNTIME_CACHE).then((cache) => {
          cache.put(request, networkResponse.clone())
        })
      }
      return networkResponse
    })
    .catch(() => null)
  
  // اگر cache داریم، فوراً برگردان
  if (cachedResponse) {
    return cachedResponse
  }
  
  // وگرنه منتظر شبکه بمان
  return fetchPromise || new Response('Resource not available', { status: 404 })
}

// =====================================================
// مدیریت پیام‌ها از Client
// =====================================================

self.addEventListener('message', (event) => {
  const { type, payload } = event.data || {}

  switch (type) {
    case 'SKIP_WAITING':
      self.skipWaiting()
      break

    case 'CLEAN_CACHE':
      cleanOldCache()
      break

    case 'CACHE_URLS':
      if (payload && payload.urls) {
        cacheUrls(payload.urls)
      }
      break

    case 'GET_CACHE_SIZE':
      getCacheSize().then((size) => {
        event.ports[0].postMessage({ size })
      })
      break

    default:
      console.log('[SW] Unknown message type:', type)
  }
})

/**
 * پاکسازی cache های قدیمی
 */
async function cleanOldCache() {
  console.log('[SW] Cleaning old cache...')
  
  const cache = await caches.open(RUNTIME_CACHE)
  const requests = await cache.keys()
  const now = Date.now()
  
  for (const request of requests) {
    const response = await cache.match(request)
    if (response) {
      const dateHeader = response.headers.get('date')
      const cacheDate = dateHeader ? new Date(dateHeader).getTime() : 0
      
      if (now - cacheDate > MAX_CACHE_AGE) {
        console.log('[SW] Deleting old cache entry:', request.url)
        await cache.delete(request)
      }
    }
  }
  
  console.log('[SW] Cache cleaned')
}

/**
 * cache کردن URL های مشخص
 */
async function cacheUrls(urls) {
  const cache = await caches.open(RUNTIME_CACHE)
  
  for (const url of urls) {
    try {
      const response = await fetch(url)
      if (response.ok) {
        await cache.put(url, response)
        console.log('[SW] Cached:', url)
      }
    } catch (error) {
      console.error('[SW] Failed to cache:', url)
    }
  }
}

/**
 * محاسبه حجم cache
 */
async function getCacheSize() {
  let totalSize = 0
  const cacheNames = await caches.keys()
  
  for (const name of cacheNames) {
    const cache = await caches.open(name)
    const requests = await cache.keys()
    
    for (const request of requests) {
      const response = await cache.match(request)
      if (response) {
        const blob = await response.clone().blob()
        totalSize += blob.size
      }
    }
  }
  
  return totalSize
}

// =====================================================
// Push Notifications
// =====================================================

self.addEventListener('push', (event) => {
  console.log('[SW] Push notification received')
  
  let data = {
    title: 'هوشاگر',
    body: 'پیام جدید دارید',
    icon: '/icons/icon-192x192.png',
    badge: '/icons/badge-72x72.png',
    tag: 'hooshagar-notification',
  }
  
  if (event.data) {
    try {
      data = { ...data, ...event.data.json() }
    } catch (e) {
      data.body = event.data.text()
    }
  }
  
  const options = {
    body: data.body,
    icon: data.icon,
    badge: data.badge,
    tag: data.tag,
    vibrate: [100, 50, 100],
    data: {
      url: data.url || '/dashboard',
      dateOfArrival: Date.now(),
    },
    actions: data.actions || [
      { action: 'open', title: 'مشاهده' },
      { action: 'close', title: 'بستن' },
    ],
    dir: 'rtl',
    lang: 'fa',
  }
  
  event.waitUntil(
    self.registration.showNotification(data.title, options)
  )
})

self.addEventListener('notificationclick', (event) => {
  console.log('[SW] Notification clicked:', event.action)
  
  event.notification.close()
  
  if (event.action === 'close') {
    return
  }
  
  const urlToOpen = event.notification.data?.url || '/dashboard'
  
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true })
      .then((clientList) => {
        // اگر تب باز است، فوکوس کن
        for (const client of clientList) {
          if (client.url.includes(self.location.origin) && 'focus' in client) {
            client.navigate(urlToOpen)
            return client.focus()
          }
        }
        
        // وگرنه تب جدید باز کن
        if (clients.openWindow) {
          return clients.openWindow(urlToOpen)
        }
      })
  )
})

// =====================================================
// Background Sync
// =====================================================

self.addEventListener('sync', (event) => {
  console.log('[SW] Background sync:', event.tag)
  
  if (event.tag === 'sync-messages') {
    event.waitUntil(syncMessages())
  }
  
  if (event.tag === 'sync-offline-data') {
    event.waitUntil(syncOfflineData())
  }
})

async function syncMessages() {
  console.log('[SW] Syncing messages...')
  // منطق همگام‌سازی پیام‌ها
}

async function syncOfflineData() {
  console.log('[SW] Syncing offline data...')
  // منطق همگام‌سازی داده‌های آفلاین
}

// =====================================================
// Periodic Background Sync
// =====================================================

self.addEventListener('periodicsync', (event) => {
  console.log('[SW] Periodic sync:', event.tag)
  
  if (event.tag === 'update-content') {
    event.waitUntil(updateContent())
  }
})

async function updateContent() {
  console.log('[SW] Updating content in background...')
  // بروزرسانی محتوا در پس‌زمینه
}

console.log('[SW] Service Worker loaded')
