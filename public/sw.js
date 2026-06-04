// هوشاگر Service Worker — فقط دارایی‌های PWA (نه chunkهای Next.js)
const CACHE_NAME = 'hooshagar-v2'
const STATIC_CACHE = ['/', '/manifest.json']

function shouldNeverCache(url) {
  return (
    url.pathname.startsWith('/_next/') ||
    url.pathname.startsWith('/api/') ||
    url.pathname.includes('__nextjs') ||
    url.searchParams.has('_rsc')
  )
}

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.addAll(STATIC_CACHE)))
  self.skipWaiting()
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k))),
    ),
  )
  self.clients.claim()
})

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return

  const url = new URL(event.request.url)
  if (url.origin !== self.location.origin) return
  if (shouldNeverCache(url)) return

  // فقط manifest و آیکون‌های ثابت — نه JS/CSS داینامیک
  const cacheable =
    url.pathname === '/' ||
    url.pathname === '/manifest.json' ||
    url.pathname.startsWith('/icons/')

  if (!cacheable) return

  event.respondWith(
    caches.match(event.request).then(
      (cached) =>
        cached ||
        fetch(event.request).then((response) => {
          if (response.status === 200) {
            const clone = response.clone()
            caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone))
          }
          return response
        }),
    ),
  )
})

self.addEventListener('push', (event) => {
  if (!event.data) return
  const data = event.data.json()
  event.waitUntil(
    self.registration.showNotification(data.title || 'هوشاگر', {
      body: data.body,
      icon: '/icons/icon-192x192.png',
      badge: '/icons/icon-72x72.png',
      dir: 'rtl',
      lang: 'fa',
      data: data.data,
    }),
  )
})

self.addEventListener('notificationclick', (event) => {
  event.notification.close()
  event.waitUntil(clients.openWindow(event.notification.data?.url || '/'))
})
