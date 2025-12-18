'use client';

import { useEffect } from 'react';

export default function RegisterServiceWorker() {
  useEffect(() => {
    if ('serviceWorker' in navigator) {
      window.addEventListener('load', () => {
        navigator.serviceWorker
          .register('/sw.js')
          .then((registration) => {
            console.log('✅ Service Worker registered:', registration);

            // چک کردن برای بروزرسانی
            registration.addEventListener('updatefound', () => {
              const newWorker = registration.installing;
              if (newWorker) {
                newWorker.addEventListener('statechange', () => {
                  if (
                    newWorker.state === 'installed' &&
                    navigator.serviceWorker.controller
                  ) {
                    // یک service worker جدید در دسترس است
                    console.log('🔄 New service worker available');
                    
                    // می‌توانید به کاربر اطلاع بدهید
                    if (confirm('نسخه جدید در دسترس است. بروزرسانی شود؟')) {
                      newWorker.postMessage({ type: 'SKIP_WAITING' });
                      window.location.reload();
                    }
                  }
                });
              }
            });
          })
          .catch((error) => {
            console.error('❌ Service Worker registration failed:', error);
          });

        // رویداد برای زمانی که service worker جدید کنترل را می‌گیرد
        let refreshing = false;
        navigator.serviceWorker.addEventListener('controllerchange', () => {
          if (refreshing) return;
          refreshing = true;
          window.location.reload();
        });
      });
    } else {
      console.warn('⚠️ Service Worker is not supported in this browser');
    }
  }, []);

  return null;
}

