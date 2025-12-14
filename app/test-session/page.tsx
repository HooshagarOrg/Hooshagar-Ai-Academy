'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase'
import Link from 'next/link'
import { Home, LogOut, User, Mail, Clock } from 'lucide-react'

export default function TestSession() {
  const [session, setSession] = useState<any>(null)
  const [profile, setProfile] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)
  
  useEffect(() => {
    async function loadData() {
      const supabase = createClient()
      const { data: { session: sessionData } } = await supabase.auth.getSession()
      setSession(sessionData)
      
      if (sessionData) {
        const { data: profileData } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', sessionData.user.id)
          .single()
        setProfile(profileData)
      }
      
      setIsLoading(false)
    }
    
    loadData()
  }, [])
  
  const handleLogout = async () => {
    try {
      const supabase = createClient()
      const { error } = await supabase.auth.signOut()
      
      if (error) {
        console.error('خطا در خروج:', error)
        alert('خطا در خروج از حساب کاربری')
        return
      }
      
      window.location.href = '/login'
    } catch (error) {
      console.error('خطا در خروج:', error)
      alert('خطا در خروج از حساب کاربری')
    }
  }
  
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-600 to-indigo-800 flex items-center justify-center" dir="rtl">
        <div className="text-white text-lg">در حال بارگذاری...</div>
      </div>
    )
  }
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800 p-4 md:p-8" dir="rtl">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 mb-6 border border-white/20">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold text-white">اطلاعات Session</h1>
            <Link 
              href="/dashboard"
              className="flex items-center gap-2 bg-white/20 hover:bg-white/30 px-4 py-2 rounded-lg transition-all text-white"
            >
              <Home className="w-4 h-4" />
              بازگشت
            </Link>
          </div>
        </div>

        {/* Session Status */}
        {session ? (
          <div className="space-y-4">
            {/* Status Card */}
            <div className="bg-green-500/20 backdrop-blur-lg rounded-2xl p-6 border border-green-500/30">
              <div className="flex items-center gap-3 mb-4">
                <div className="bg-green-500 p-3 rounded-xl">
                  <User className="w-6 h-6 text-white" />
                </div>
                <div>
                  <p className="text-white text-lg font-bold">✅ لاگین هستید!</p>
                  <p className="text-white/60 text-sm">Session فعال است</p>
                </div>
              </div>
            </div>

            {/* User Info */}
            <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20">
              <h2 className="text-white font-bold mb-4">اطلاعات کاربری</h2>
              <div className="space-y-3">
                <div className="flex items-center gap-3 text-white">
                  <Mail className="w-5 h-5 text-blue-400" />
                  <span className="text-white/60">ایمیل:</span>
                  <span className="font-medium">{session.user.email}</span>
                </div>
                <div className="flex items-center gap-3 text-white">
                  <User className="w-5 h-5 text-purple-400" />
                  <span className="text-white/60">User ID:</span>
                  <span className="font-mono text-sm">{session.user.id}</span>
                </div>
                {profile && (
                  <>
                    <div className="flex items-center gap-3 text-white">
                      <User className="w-5 h-5 text-green-400" />
                      <span className="text-white/60">نام:</span>
                      <span className="font-medium">{profile.full_name}</span>
                    </div>
                    <div className="flex items-center gap-3 text-white">
                      <User className="w-5 h-5 text-yellow-400" />
                      <span className="text-white/60">نقش:</span>
                      <span className="font-medium">{profile.role}</span>
                    </div>
                  </>
                )}
                <div className="flex items-center gap-3 text-white">
                  <Clock className="w-5 h-5 text-orange-400" />
                  <span className="text-white/60">آخرین ورود:</span>
                  <span className="text-sm">{new Date(session.user.last_sign_in_at || '').toLocaleString('fa-IR')}</span>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20">
              <h2 className="text-white font-bold mb-4">عملیات</h2>
              <div className="flex gap-3">
                <Link
                  href="/dashboard"
                  className="flex-1 flex items-center justify-center gap-2 bg-blue-500 hover:bg-blue-600 px-4 py-3 rounded-xl transition-all text-white font-medium"
                >
                  <Home className="w-5 h-5" />
                  داشبورد
                </Link>
                <button
                  onClick={handleLogout}
                  className="flex-1 flex items-center justify-center gap-2 bg-red-500 hover:bg-red-600 px-4 py-3 rounded-xl transition-all text-white font-medium"
                >
                  <LogOut className="w-5 h-5" />
                  خروج
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-red-500/20 backdrop-blur-lg rounded-2xl p-6 border border-red-500/30">
            <div className="flex items-center gap-3 mb-4">
              <div className="bg-red-500 p-3 rounded-xl">
                <User className="w-6 h-6 text-white" />
              </div>
              <div>
                <p className="text-white text-lg font-bold">❌ لاگین نیستید!</p>
                <p className="text-white/60 text-sm">لطفاً ابتدا وارد شوید</p>
              </div>
            </div>
            <Link
              href="/login"
              className="block w-full bg-blue-500 hover:bg-blue-600 text-center px-4 py-3 rounded-xl transition-all text-white font-medium mt-4"
            >
              ورود به سیستم
            </Link>
          </div>
        )}
      </div>
    </div>
  )
}






























































