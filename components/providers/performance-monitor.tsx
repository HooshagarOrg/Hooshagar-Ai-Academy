'use client';

import { useEffect } from 'react';
import { useReportWebVitals } from 'next/web-vitals';

/**
 * Performance Monitor Component
 * مانیتور Web Vitals و گزارش به Analytics
 */
export function PerformanceMonitor() {
  useReportWebVitals((metric) => {
    // Log to console in development
    if (process.env.NODE_ENV === 'development') {
      console.log('[Performance]', metric);
    }

    // Send to analytics
    sendToAnalytics(metric);
  });

  // Monitor long tasks
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const observer = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        if (entry.duration > 50) {
          console.warn('[Long Task]', {
            duration: entry.duration,
            startTime: entry.startTime,
          });

          // Send to monitoring service
          sendToMonitoring({
            type: 'long-task',
            duration: entry.duration,
            timestamp: Date.now(),
          });
        }
      }
    });

    try {
      observer.observe({ entryTypes: ['longtask'] });
    } catch (e) {
      // Long task API not supported
    }

    return () => observer.disconnect();
  }, []);

  return null;
}

/**
 * Send metrics to analytics service
 */
function sendToAnalytics(metric: any) {
  const body = JSON.stringify({
    name: metric.name,
    value: metric.value,
    rating: metric.rating,
    delta: metric.delta,
    id: metric.id,
    navigationType: metric.navigationType,
  });

  // Use `navigator.sendBeacon()` if available, falling back to `fetch()`
  if (navigator.sendBeacon) {
    navigator.sendBeacon('/api/analytics/vitals', body);
  } else {
    fetch('/api/analytics/vitals', {
      body,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      keepalive: true,
    }).catch(console.error);
  }
}

/**
 * Send custom monitoring events
 */
function sendToMonitoring(data: Record<string, any>) {
  fetch('/api/analytics/monitoring', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
    keepalive: true,
  }).catch(console.error);
}





