'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase'

export default function TestLogin() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [result, setResult] = useState<any>(null)

  const handleTest = async () => {
    const supabase = createClient()
    
    console.log('Testing login...')
    
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })
    
    setResult({ data, error })
    console.log('Result:', { data, error })
  }

  return (
    <div className="p-8 max-w-md mx-auto">
      <h1 className="text-2xl font-bold mb-4">تست Login</h1>
      
      <input
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="ایمیل"
        className="w-full p-2 border rounded mb-2"
      />
      
      <input
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        placeholder="رمز عبور"
        className="w-full p-2 border rounded mb-4"
      />
      
      <button
        onClick={handleTest}
        className="w-full bg-blue-500 text-white p-2 rounded"
      >
        تست ورود
      </button>
      
      {result && (
        <pre className="mt-4 p-4 bg-gray-100 rounded text-sm overflow-auto" dir="ltr">
          {JSON.stringify(result, null, 2)}
        </pre>
      )}
    </div>
  )
}
























