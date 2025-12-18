// Service Worker برای PWA هوشاگر
// نسخه: 1.0.0

const CACHE_NAME = 'hooshagar-v1';
const RUNTIME_CACHE = 'hooshagar-runtime';
const IMAGE_CACHE = 'hooshagar-images';

// فایل‌های استاتیک برای cache کردن
const PRECACHE_URLS = [
  '/',
  '/dashboard',
  '/login',
  '/offline',
  '/manifest.json',
];

// Install Event - Pre-caching
self.addEventListener('install', (event) => {
  console.log('[SW] Installing Service Worker...');
  
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('[SW] Pre-caching app shell');
      return cache.addAll(PRECACHE_URLS);
    })
  );
  
  // فعال‌سازی فوری
  self.skipWaiting();
});

// Activate Event - Clean up old caches
self.addEventListener('activate', (event) => {
  console.log('[SW] Activating Service Worker...');
  
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((cacheName) => {
            return cacheName !== CACHE_NAME && 
                   cacheName !== RUNTIME_CACHE && 
                   cacheName !== IMAGE_CACHE;
          })
          .map((cacheName) => {
            console.log('[SW] Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          })
      );
    })
  );
  
  // کنترل فوری همه clients
  return self.clients.claim();
});

// Fetch Event - Caching strategies
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);
  
  // فقط درخواست‌های HTTP/HTTPS
  if (!url.protocol.startsWith('http')) {
    return;
  }
  
  // استراتژی‌های مختلف بر اساس نوع درخواست
  
  // 1. Navigation requests - Network First
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((response) => {
          // کپی response در cache
          const responseClone = response.clone();
          caches.open(RUNTIME_CACHE).then((cache) => {
            cache.put(request, responseClone);
          });
          return response;
        })
        .catch(() => {
          // اگر آفلاین هستیم، صفحه offline را نمایش بده
          return caches.match('/offline').then((response) => {
            return response || new Response('Offline', { status: 503 });
          });
        })
    );
    return;
  }
  
  // 2. API requests - Network First with cache fallback
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(
      fetch(request)
        .then((response) => {
          // فقط GET requests را cache کن
          if (request.method === 'GET' && response.status === 200) {
            const responseClone = response.clone();
            caches.open(RUNTIME_CACHE).then((cache) => {
              cache.put(request, responseClone);
            });
          }
          return response;
        })
        .catch(() => {
          // اگر آفلاین، از cache استفاده کن
          return caches.match(request).then((cachedResponse) => {
            if (cachedResponse) {
              return cachedResponse;
            }
            // اگر cache هم نداریم، خطا برگردان
            return new Response(
              JSON.stringify({ error: 'شما آفلاین هستید' }),
              {
                status: 503,
                headers: { 'Content-Type': 'application/json' },
              }
            );
          });
        })
    );
    return;
  }
  
  // 3. Images - Cache First
  if (request.destination === 'image') {
    event.respondWith(
      caches.open(IMAGE_CACHE).then((cache) => {
        return cache.match(request).then((cachedResponse) => {
          if (cachedResponse) {
            return cachedResponse;
          }
          
          return fetch(request).then((response) => {
            // فقط تصاویر موفق را cache کن
            if (response.status === 200) {
              cache.put(request, response.clone());
            }
            return response;
          });
        });
      })
    );
    return;
  }
  
  // 4. Static assets - Cache First with network fallback
  if (
    url.pathname.startsWith('/_next/static/') ||
    url.pathname.endsWith('.js') ||
    url.pathname.endsWith('.css') ||
    url.pathname.endsWith('.woff2')
  ) {
    event.respondWith(
      caches.match(request).then((cachedResponse) => {
        if (cachedResponse) {
          return cachedResponse;
        }
        
        return fetch(request).then((response) => {
          if (response.status === 200) {
            const responseClone = response.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(request, responseClone);
            });
          }
          return response;
        });
      })
    );
    return;
  }
  
  // 5. Default - Network First
  event.respondWith(
    fetch(request)
      .then((response) => {
        return response;
      })
      .catch(() => {
        return caches.match(request);
      })
  );
});

// Background Sync - برای ارسال دوباره درخواست‌های ناموفق
self.addEventListener('sync', (event) => {
  console.log('[SW] Background sync:', event.tag);
  
  if (event.tag === 'sync-notifications') {
    event.waitUntil(syncNotifications());
  }
});

async function syncNotifications() {
  try {
    const response = await fetch('/api/notifications?unreadOnly=true');
    const data = await response.json();
    
    // نمایش notification اگر اعلان جدید داریم
    if (data.unreadCount > 0) {
      self.registration.showNotification('هوشاگر', {
        body: `شما ${data.unreadCount} اعلان جدید دارید`,
        icon: '/icons/icon-192x192.png',
        badge: '/icons/icon-96x96.png',
        tag: 'notification-sync',
        requireInteraction: false,
      });
    }
  } catch (error) {
    console.error('[SW] Sync failed:', error);
  }
}

// Push Notification
self.addEventListener('push', (event) => {
  console.log('[SW] Push notification received');
  
  let data = { title: 'هوشاگر', body: 'اعلان جدید' };
  
  if (event.data) {
    try {
      data = event.data.json();
    } catch (e) {
      data.body = event.data.text();
    }
  }
  
  const options = {
    body: data.body,
    icon: '/icons/icon-192x192.png',
    badge: '/icons/icon-96x96.png',
    vibrate: [200, 100, 200],
    tag: data.tag || 'notification',
    data: data.data || {},
    actions: [
      {
        action: 'open',
        title: 'مشاهده',
      },
      {
        action: 'close',
        title: 'بستن',
      },
    ],
  };
  
  event.waitUntil(
    self.registration.showNotification(data.title, options)
  );
});

// Notification Click
self.addEventListener('notificationclick', (event) => {
  console.log('[SW] Notification clicked:', event.action);
  
  event.notification.close();
  
  if (event.action === 'open' || !event.action) {
    // باز کردن برنامه
    event.waitUntil(
      clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
        // اگر پنجره‌ای باز است، focus کن
        for (let client of clientList) {
          if (client.url.includes('/dashboard') && 'focus' in client) {
            return client.focus();
          }
        }
        // اگر پنجره‌ای باز نیست، پنجره جدید باز کن
        if (clients.openWindow) {
          return clients.openWindow('/notifications');
        }
      })
    );
  }
});

// Message از Client
self.addEventListener('message', (event) => {
  console.log('[SW] Message received:', event.data);
  
  if (event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
  
  if (event.data.type === 'CLEAR_CACHE') {
    event.waitUntil(
      caches.keys().then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => caches.delete(cacheName))
        );
      })
    );
  }
});

console.log('[SW] Service Worker loaded successfully!');
