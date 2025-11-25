'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'
import { Button } from '@/components/ui/button'

export function LogoutButton() {
  const router = useRouter()
  const supabase = createClient()
  const [isLoading, setIsLoading] = useState(false)

  const handleLogout = async () => {
    setIsLoading(true)

    try {
      const { error } = await supabase.auth.signOut()

      if (error) {
        console.error('خطا در خروج:', error)
        alert('خطا در خروج از سیستم')
        return
      }

      // هدایت به صفحه login
      router.push('/login')
      router.refresh()
    } catch (error) {
      console.error('خطا:', error)
      alert('خطا در خروج از سیستم')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Button
      onClick={handleLogout}
      disabled={isLoading}
      variant="destructive"
      className="w-full"
    >
      {isLoading ? 'در حال خروج...' : 'خروج از سیستم'}
    </Button>
  )
}


