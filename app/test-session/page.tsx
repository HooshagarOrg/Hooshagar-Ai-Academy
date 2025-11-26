'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase'

export default function TestSession() {
  const [session, setSession] = useState<any>(null)
  
  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session)
    })
  }, [])
  
  return (
    <div className="p-8">
      <h1 className="text-2xl mb-4">تست Session</h1>
      {session ? (
        <div className="bg-green-100 p-4 rounded">
          <p>✅ لاگین هستید!</p>
          <p>ایمیل: {session.user.email}</p>
        </div>
      ) : (
        <div className="bg-red-100 p-4 rounded">
          <p>❌ لاگین نیستید!</p>
        </div>
      )}
    </div>
  )
}














