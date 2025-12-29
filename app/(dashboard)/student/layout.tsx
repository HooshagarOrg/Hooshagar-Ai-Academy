/**
 * Student Layout
 * 
 * Layout برای بخش دانش‌آموزان
 */

import { createClient } from '@/lib/supabase-server'
import { redirect } from 'next/navigation'

export default async function StudentLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  
  // بررسی لاگین
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    redirect('/login')
  }
  
  // بررسی role (اختیاری - می‌توانیم غیرفعال کنیم)
  // const { data: profile } = await supabase
  //   .from('profiles')
  //   .select('role')
  //   .eq('id', user.id)
  //   .single()
  
  // if (profile?.role && profile.role !== 'student') {
  //   redirect('/admin?error=access_denied')
  // }
  
  return (
    <div>
      {children}
    </div>
  )
}

