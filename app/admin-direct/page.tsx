'use client'

/**
 * صفحه Admin مستقیم (بدون Authentication)
 * فقط برای Development و تست
 * ⚠️ این صفحه را در Production حذف کنید!
 */

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'

export default function AdminDirectPage() {
  const [stats, setStats] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // تست سیستم AI
    fetch('/api/admin/ai-usage-stats')
      .then(res => res.json())
      .then(data => {
        setStats(data)
        setLoading(false)
      })
      .catch(err => {
        console.error('Error:', err)
        setLoading(false)
      })
  }, [])

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            🛠️ Admin Panel (Development)
          </h1>
          <p className="text-gray-600">
            دسترسی مستقیم بدون Authentication - فقط برای تست
          </p>
          <Badge variant="destructive" className="mt-2">
            ⚠️ حذف کنید در Production
          </Badge>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardHeader>
              <CardTitle>🤖 AI System</CardTitle>
            </CardHeader>
            <CardContent>
              <Button 
                onClick={() => window.open('/admin-direct/ai-system', '_blank')}
                className="w-full"
              >
                مشاهده سیستم AI
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>📊 Database</CardTitle>
            </CardHeader>
            <CardContent>
              <Button 
                onClick={() => window.open('https://supabase.com', '_blank')}
                variant="outline"
                className="w-full"
              >
                باز کردن Supabase
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>📝 Docs</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <Button 
                  onClick={() => window.open('/COMPLETE_AI_SYSTEM.md', '_blank')}
                  variant="outline"
                  className="w-full text-sm"
                  size="sm"
                >
                  مستندات AI
                </Button>
                <Button 
                  onClick={() => window.open('/VERCEL_DEPLOYMENT.md', '_blank')}
                  variant="outline"
                  className="w-full text-sm"
                  size="sm"
                >
                  راهنمای Deploy
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Stats */}
        <Card>
          <CardHeader>
            <CardTitle>📊 آمار سیستم</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <p className="text-gray-500">در حال بارگذاری...</p>
            ) : stats ? (
              <pre className="bg-gray-100 p-4 rounded-lg overflow-auto">
                {JSON.stringify(stats, null, 2)}
              </pre>
            ) : (
              <div className="text-center py-8">
                <p className="text-gray-500 mb-4">
                  سیستم AI آماده نیست یا Authentication نیاز دارد
                </p>
                <Button 
                  onClick={() => window.location.href = '/login'}
                  variant="default"
                >
                  برو به صفحه Login
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Instructions */}
        <Card className="mt-8 border-yellow-300 bg-yellow-50">
          <CardHeader>
            <CardTitle className="text-yellow-800">
              💡 راهنمای حل مشکل Authentication
            </CardTitle>
          </CardHeader>
          <CardContent className="text-yellow-800">
            <ol className="list-decimal list-inside space-y-2">
              <li>در Supabase SQL Editor این کوئری را اجرا کنید:</li>
              <pre className="bg-white p-3 rounded my-2 text-sm">
{`UPDATE profiles 
SET role = 'admin'
WHERE email = 'thegamblerman@protonmail.com';`}
              </pre>
              <li>سرور را Restart کنید (Ctrl+C و npm run dev)</li>
              <li>Cache مرورگر را پاک کنید (Ctrl+Shift+Delete)</li>
              <li>به /login بروید و دوباره Login کنید</li>
              <li>حالا /admin/ai-system باید کار کند</li>
            </ol>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}





