'use client'

import { useEffect } from 'react'
import {
  AlertOctagon,
  RefreshCw,
  Home,
} from 'lucide-react'

// ============================================
// تایپ‌ها
// ============================================
interface GlobalErrorProps {
  error: Error & { digest?: string }
  reset: () => void
}

// ============================================
// کامپوننت Global Error Boundary
// برای خطاهای layout و root
// ============================================
export default function GlobalError({ error, reset }: GlobalErrorProps) {
  // لاگ خطا
  useEffect(() => {
    // در development لاگ کن
    if (process.env.NODE_ENV === 'development') {
      console.error('🔴 Global Error:', error)
    }
    
    // در production به سرویس مانیتورینگ ارسال کنید
    // مثال: Sentry.captureException(error)
  }, [error])

  return (
    <html lang="fa" dir="rtl">
      <body>
        <div 
          className="min-h-screen flex items-center justify-center p-4"
          style={{
            background: 'linear-gradient(to bottom right, #0f172a, #1e3a5f, #0f172a)',
            fontFamily: 'Vazir, Tahoma, sans-serif',
          }}
        >
          <div 
            className="max-w-md w-full text-center p-8 rounded-3xl"
            style={{
              background: 'rgba(255, 255, 255, 0.1)',
              backdropFilter: 'blur(10px)',
              border: '1px solid rgba(255, 255, 255, 0.2)',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
            }}
          >
            {/* آیکون */}
            <div 
              className="w-20 h-20 mx-auto mb-6 rounded-full flex items-center justify-center"
              style={{
                background: 'linear-gradient(to bottom right, #ef4444, #f97316)',
                boxShadow: '0 10px 25px rgba(239, 68, 68, 0.4)',
              }}
            >
              <AlertOctagon 
                style={{ width: '40px', height: '40px', color: 'white' }} 
              />
            </div>

            {/* عنوان */}
            <h1 
              style={{ 
                fontSize: '1.75rem', 
                fontWeight: 'bold', 
                color: 'white',
                marginBottom: '0.75rem',
              }}
            >
              خطای سیستمی 🛑
            </h1>

            {/* توضیحات */}
            <p 
              style={{ 
                color: 'rgba(255, 255, 255, 0.6)',
                marginBottom: '2rem',
                lineHeight: '1.8',
              }}
            >
              یک خطای غیرمنتظره در سیستم رخ داده است.
              <br />
              لطفاً صفحه را بارگذاری مجدد کنید.
            </p>

            {/* دکمه‌ها */}
            <div 
              style={{ 
                display: 'flex', 
                flexDirection: 'column', 
                gap: '0.75rem',
              }}
            >
              <button
                onClick={reset}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.5rem',
                  padding: '1rem 1.5rem',
                  background: 'linear-gradient(to right, #3b82f6, #06b6d4)',
                  color: 'white',
                  fontWeight: 'bold',
                  borderRadius: '0.75rem',
                  border: 'none',
                  cursor: 'pointer',
                  fontSize: '1rem',
                  boxShadow: '0 10px 25px rgba(59, 130, 246, 0.4)',
                  transition: 'transform 0.2s, box-shadow 0.2s',
                }}
                onMouseOver={(e) => {
                  e.currentTarget.style.transform = 'scale(1.02)'
                  e.currentTarget.style.boxShadow = '0 15px 30px rgba(59, 130, 246, 0.5)'
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.transform = 'scale(1)'
                  e.currentTarget.style.boxShadow = '0 10px 25px rgba(59, 130, 246, 0.4)'
                }}
              >
                <RefreshCw style={{ width: '20px', height: '20px' }} />
                تلاش دوباره
              </button>

              <a
                href="/"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.5rem',
                  padding: '1rem 1.5rem',
                  background: 'rgba(255, 255, 255, 0.1)',
                  color: 'white',
                  fontWeight: 'bold',
                  borderRadius: '0.75rem',
                  border: '1px solid rgba(255, 255, 255, 0.2)',
                  textDecoration: 'none',
                  fontSize: '1rem',
                  transition: 'background 0.2s',
                }}
                onMouseOver={(e) => {
                  e.currentTarget.style.background = 'rgba(255, 255, 255, 0.2)'
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)'
                }}
              >
                <Home style={{ width: '20px', height: '20px' }} />
                بازگشت به خانه
              </a>
            </div>

            {/* شناسه خطا */}
            {error.digest && (
              <p 
                style={{ 
                  marginTop: '1.5rem',
                  padding: '0.75rem',
                  background: 'rgba(255, 255, 255, 0.05)',
                  borderRadius: '0.5rem',
                  color: 'rgba(255, 255, 255, 0.4)',
                  fontSize: '0.75rem',
                  fontFamily: 'monospace',
                }}
              >
                کد خطا: {error.digest}
              </p>
            )}

            {/* Footer */}
            <p 
              style={{ 
                marginTop: '2rem',
                color: 'rgba(255, 255, 255, 0.3)',
                fontSize: '0.75rem',
              }}
            >
              سیستم هوشمند مدیریت مدارس - هوشاگر
            </p>
          </div>
        </div>
      </body>
    </html>
  )
}





