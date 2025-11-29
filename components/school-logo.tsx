'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import { cn } from '@/lib/utils'

// ============================================
// تایپ‌ها
// ============================================

interface SchoolLogoProps {
  /** شناسه مدرسه (اگر نباشد از کاربر فعلی گرفته می‌شود) */
  schoolId?: string
  /** اندازه لوگو */
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl'
  /** تم رنگی (برای متن نام مدرسه) */
  variant?: 'light' | 'dark' | 'auto'
  /** نمایش نام مدرسه کنار لوگو */
  showName?: boolean
  /** موقعیت نام نسبت به لوگو */
  namePosition?: 'right' | 'bottom'
  /** کلاس CSS اضافی */
  className?: string
  /** نمایش skeleton در حال بارگذاری */
  showSkeleton?: boolean
  /** کالبک کلیک روی لوگو */
  onClick?: () => void
  /** فعال بودن لینک به داشبورد */
  linkToDashboard?: boolean
}

interface SchoolData {
  logoUrl: string | null
  name: string
  primaryColor: string
}

// ============================================
// اندازه‌های لوگو
// ============================================

const SIZES = {
  xs: { logo: 24, text: 'text-xs', font: 10 },
  sm: { logo: 32, text: 'text-sm', font: 13 },
  md: { logo: 48, text: 'text-base', font: 19 },
  lg: { logo: 64, text: 'text-lg', font: 26 },
  xl: { logo: 96, text: 'text-xl', font: 38 },
  '2xl': { logo: 128, text: 'text-2xl', font: 51 },
}

// ============================================
// Skeleton Component
// ============================================

function LogoSkeleton({ size }: { size: keyof typeof SIZES }) {
  const sizeValue = SIZES[size].logo

  return (
    <div
      className="animate-pulse bg-gray-200 rounded-lg"
      style={{ width: sizeValue, height: sizeValue }}
    />
  )
}

// ============================================
// Fallback Component (حرف اول نام)
// ============================================

function LogoFallback({
  name,
  size,
  primaryColor,
}: {
  name: string
  size: keyof typeof SIZES
  primaryColor: string
}) {
  const sizeValue = SIZES[size].logo
  const fontSize = SIZES[size].font

  return (
    <div
      className="flex items-center justify-center rounded-lg text-white font-bold shadow-sm"
      style={{
        width: sizeValue,
        height: sizeValue,
        fontSize,
        background: `linear-gradient(135deg, ${primaryColor} 0%, ${adjustColor(primaryColor, -20)} 100%)`,
      }}
    >
      {name.charAt(0)}
    </div>
  )
}

// ============================================
// Helper: تنظیم روشنایی رنگ
// ============================================

function adjustColor(hex: string, percent: number): string {
  const num = parseInt(hex.replace('#', ''), 16)
  const amt = Math.round(2.55 * percent)
  const R = (num >> 16) + amt
  const G = ((num >> 8) & 0x00ff) + amt
  const B = (num & 0x0000ff) + amt

  return (
    '#' +
    (
      0x1000000 +
      (R < 255 ? (R < 1 ? 0 : R) : 255) * 0x10000 +
      (G < 255 ? (G < 1 ? 0 : G) : 255) * 0x100 +
      (B < 255 ? (B < 1 ? 0 : B) : 255)
    )
      .toString(16)
      .slice(1)
  )
}

// ============================================
// کامپوننت اصلی
// ============================================

export default function SchoolLogo({
  schoolId,
  size = 'md',
  variant = 'auto',
  showName = false,
  namePosition = 'right',
  className = '',
  showSkeleton = true,
  onClick,
  linkToDashboard = false,
}: SchoolLogoProps) {
  const [schoolData, setSchoolData] = useState<SchoolData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(false)

  // ============================================
  // دریافت اطلاعات مدرسه
  // ============================================

  useEffect(() => {
    const fetchSchoolData = async () => {
      try {
        setIsLoading(true)
        setError(false)

        // در محیط واقعی از Supabase استفاده می‌شود
        // const supabase = createClient()
        
        // اگر schoolId نداریم، از کاربر فعلی بگیریم
        // let currentSchoolId = schoolId
        // if (!currentSchoolId) {
        //   const { data: { user } } = await supabase.auth.getUser()
        //   if (user) {
        //     const { data: profile } = await supabase
        //       .from('profiles')
        //       .select('school_id')
        //       .eq('id', user.id)
        //       .single()
        //     currentSchoolId = profile?.school_id
        //   }
        // }

        // if (currentSchoolId) {
        //   const { data: school } = await supabase
        //     .from('schools')
        //     .select('logo_url, name, primary_color')
        //     .eq('id', currentSchoolId)
        //     .single()
        //   if (school) {
        //     setSchoolData({
        //       logoUrl: school.logo_url,
        //       name: school.name,
        //       primaryColor: school.primary_color || '#3b82f6',
        //     })
        //   }
        // }

        // داده نمونه
        await new Promise((r) => setTimeout(r, 300))
        setSchoolData({
          logoUrl: null, // یا URL تصویر
          name: 'دبستان تلاش',
          primaryColor: '#3b82f6',
        })
      } catch (err) {
        console.error('Error fetching school data:', err)
        setError(true)
      } finally {
        setIsLoading(false)
      }
    }

    fetchSchoolData()
  }, [schoolId])

  // ============================================
  // تعیین رنگ متن
  // ============================================

  const getTextColorClass = () => {
    if (variant === 'light') return 'text-gray-900'
    if (variant === 'dark') return 'text-white'
    // auto - تشخیص از محیط
    return 'text-gray-900 dark:text-white'
  }

  // ============================================
  // Render
  // ============================================

  // در حال بارگذاری
  if (isLoading && showSkeleton) {
    return (
      <div className={cn('flex items-center gap-2', className)}>
        <LogoSkeleton size={size} />
        {showName && (
          <div className="animate-pulse h-4 w-24 bg-gray-200 rounded" />
        )}
      </div>
    )
  }

  // خطا یا داده نامعتبر
  if (error || !schoolData) {
    return (
      <div className={cn('flex items-center gap-2', className)}>
        <div
          className="bg-gray-200 rounded-lg flex items-center justify-center text-gray-400"
          style={{ width: SIZES[size].logo, height: SIZES[size].logo }}
        >
          ?
        </div>
      </div>
    )
  }

  const { logoUrl, name, primaryColor } = schoolData
  const sizeValue = SIZES[size].logo

  // ============================================
  // محتوای لوگو
  // ============================================

  const logoContent = (
    <div
      className={cn(
        'flex items-center gap-2',
        namePosition === 'bottom' && 'flex-col',
        onClick && 'cursor-pointer',
        className
      )}
      onClick={onClick}
    >
      {logoUrl ? (
        <Image
          src={logoUrl}
          alt={name}
          width={sizeValue}
          height={sizeValue}
          className="object-contain"
          priority
          onError={() => setError(true)}
        />
      ) : (
        <LogoFallback name={name} size={size} primaryColor={primaryColor} />
      )}

      {showName && name && (
        <span
          className={cn(
            'font-semibold truncate',
            SIZES[size].text,
            getTextColorClass()
          )}
        >
          {name}
        </span>
      )}
    </div>
  )

  // با لینک
  if (linkToDashboard) {
    return (
      <a href="/dashboard" className="no-underline">
        {logoContent}
      </a>
    )
  }

  return logoContent
}

// ============================================
// Export های اضافی
// ============================================

export { LogoSkeleton, LogoFallback }
export type { SchoolLogoProps, SchoolData }

