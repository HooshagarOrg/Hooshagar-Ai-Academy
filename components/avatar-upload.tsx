'use client'

import { useState, useRef, useCallback } from 'react'
import Image from 'next/image'
import {
  Camera,
  Trash2,
  Upload,
  Loader2,
  CheckCircle2,
  AlertCircle,
  User,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

// ============================================
// تایپ‌ها و اینترفیس‌ها
// ============================================

type AvatarSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl'

interface AvatarUploadProps {
  /** شناسه کاربر */
  userId: string
  /** آدرس آواتار فعلی */
  currentAvatar?: string
  /** نام کاربر برای نمایش حروف اول در صورت نبود آواتار */
  userName?: string
  /** callback بعد از آپلود موفق */
  onUploadComplete: (url: string, path: string) => void
  /** callback برای حذف آواتار */
  onDelete?: () => void
  /** اندازه آواتار */
  size?: AvatarSize
  /** غیرفعال کردن امکان آپلود */
  disabled?: boolean
  /** نمایش دکمه‌ها */
  showButtons?: boolean
  /** کلاس‌های CSS اضافی */
  className?: string
}

// ============================================
// Constants
// ============================================

const SIZE_CLASSES: Record<AvatarSize, { container: string; icon: string; overlay: string }> = {
  xs: {
    container: 'w-12 h-12',
    icon: 'w-5 h-5',
    overlay: 'w-4 h-4',
  },
  sm: {
    container: 'w-20 h-20',
    icon: 'w-8 h-8',
    overlay: 'w-5 h-5',
  },
  md: {
    container: 'w-32 h-32',
    icon: 'w-12 h-12',
    overlay: 'w-8 h-8',
  },
  lg: {
    container: 'w-40 h-40',
    icon: 'w-16 h-16',
    overlay: 'w-10 h-10',
  },
  xl: {
    container: 'w-48 h-48',
    icon: 'w-20 h-20',
    overlay: 'w-12 h-12',
  },
}

const MAX_FILE_SIZE = 2 * 1024 * 1024 // 2MB
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp']

// ============================================
// Helper: Get Initials
// ============================================

function getInitials(name?: string): string {
  if (!name) return ''
  return name
    .split(' ')
    .map((word) => word[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)
}

// ============================================
// Helper: Generate gradient from name
// ============================================

function getGradientFromName(name?: string): string {
  if (!name) return 'from-blue-400 to-purple-500'

  const gradients = [
    'from-blue-400 to-purple-500',
    'from-green-400 to-cyan-500',
    'from-orange-400 to-red-500',
    'from-pink-400 to-rose-500',
    'from-indigo-400 to-blue-500',
    'from-teal-400 to-emerald-500',
    'from-amber-400 to-orange-500',
    'from-violet-400 to-purple-500',
  ]

  const hash = name.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0)
  return gradients[hash % gradients.length]
}

// ============================================
// کامپوننت اصلی
// ============================================

export default function AvatarUpload({
  userId,
  currentAvatar,
  userName,
  onUploadComplete,
  onDelete,
  size = 'md',
  disabled = false,
  showButtons = true,
  className,
}: AvatarUploadProps) {
  // State ها
  const [preview, setPreview] = useState<string>(currentAvatar || '')
  const [isUploading, setIsUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [uploadStatus, setUploadStatus] = useState<'idle' | 'uploading' | 'success' | 'error'>('idle')
  const [isDragging, setIsDragging] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // سایزها
  const sizeConfig = SIZE_CLASSES[size]
  const initials = getInitials(userName)
  const gradient = getGradientFromName(userName)

  // ============================================
  // Validate File
  // ============================================

  const validateFile = useCallback((file: File): string | null => {
    if (!ALLOWED_TYPES.includes(file.type)) {
      return 'لطفاً فقط تصویر (JPG، PNG، GIF یا WebP) انتخاب کنید'
    }

    if (file.size > MAX_FILE_SIZE) {
      return 'حجم تصویر نباید بیشتر از 2 مگابایت باشد'
    }

    return null
  }, [])

  // ============================================
  // Handle File Select
  // ============================================

  const handleFileSelect = useCallback(
    async (file: File) => {
      // Validate
      const error = validateFile(file)
      if (error) {
        toast.error(error)
        return
      }

      // Show preview immediately
      const reader = new FileReader()
      reader.onloadend = () => {
        setPreview(reader.result as string)
      }
      reader.readAsDataURL(file)

      // Upload
      await handleUpload(file)
    },
    [validateFile]
  )

  // ============================================
  // Handle Upload
  // ============================================

  const handleUpload = async (file: File) => {
    setIsUploading(true)
    setUploadProgress(0)
    setUploadStatus('uploading')

    // Simulate progress
    const progressInterval = setInterval(() => {
      setUploadProgress((prev) => {
        if (prev >= 90) {
          clearInterval(progressInterval)
          return 90
        }
        return prev + 10
      })
    }, 100)

    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('type', 'avatar')
      formData.append('userId', userId)

      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      })

      const data = await response.json()

      clearInterval(progressInterval)

      if (!data.success) {
        throw new Error(data.error || 'خطا در آپلود')
      }

      setUploadProgress(100)
      setUploadStatus('success')
      setPreview(data.url)

      onUploadComplete(data.url, data.path)
      toast.success('آواتار با موفقیت آپلود شد')

      // Reset status after delay
      setTimeout(() => {
        setUploadStatus('idle')
        setUploadProgress(0)
      }, 2000)
    } catch (error) {
      clearInterval(progressInterval)
      console.error('Upload error:', error)

      setUploadStatus('error')
      setPreview(currentAvatar || '')

      toast.error(error instanceof Error ? error.message : 'خطا در آپلود آواتار')

      // Reset status after delay
      setTimeout(() => {
        setUploadStatus('idle')
        setUploadProgress(0)
      }, 2000)
    } finally {
      setIsUploading(false)
    }
  }

  // ============================================
  // Handle Delete
  // ============================================

  const handleDelete = async () => {
    if (!onDelete || !preview) return

    try {
      setPreview('')
      onDelete()
      toast.success('آواتار حذف شد')
    } catch (error) {
      console.error('Delete error:', error)
      toast.error('خطا در حذف آواتار')
      setPreview(currentAvatar || '')
    }
  }

  // ============================================
  // Drag & Drop Handlers
  // ============================================

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (!disabled) {
      setIsDragging(true)
    }
  }, [disabled])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)
  }, [])

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      e.stopPropagation()
      setIsDragging(false)

      if (disabled) return

      const file = e.dataTransfer.files[0]
      if (file) {
        handleFileSelect(file)
      }
    },
    [disabled, handleFileSelect]
  )

  // ============================================
  // Input Change Handler
  // ============================================

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      handleFileSelect(file)
    }
  }

  // ============================================
  // Click Handler
  // ============================================

  const handleClick = () => {
    if (!disabled && !isUploading) {
      fileInputRef.current?.click()
    }
  }

  // ============================================
  // Render
  // ============================================

  return (
    <div className={cn('flex flex-col items-center gap-4', className)} dir="rtl">
      {/* Avatar Container */}
      <div
        className={cn(
          sizeConfig.container,
          'relative rounded-full overflow-hidden border-4 transition-all cursor-pointer',
          isDragging
            ? 'border-blue-400 ring-4 ring-blue-200 scale-105'
            : uploadStatus === 'success'
            ? 'border-green-400'
            : uploadStatus === 'error'
            ? 'border-red-400'
            : 'border-gray-200 hover:border-blue-300',
          disabled && 'opacity-50 cursor-not-allowed'
        )}
        onClick={handleClick}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        {/* Avatar Image or Placeholder */}
        {preview ? (
          <Image
            src={preview}
            alt="Avatar"
            fill
            className="object-cover"
            sizes={`(max-width: 768px) ${size === 'xl' ? '192px' : size === 'lg' ? '160px' : '128px'}, ${size === 'xl' ? '192px' : size === 'lg' ? '160px' : '128px'}`}
          />
        ) : (
          <div
            className={cn(
              'w-full h-full flex items-center justify-center bg-gradient-to-br',
              gradient
            )}
          >
            {initials ? (
              <span
                className={cn(
                  'text-white font-bold',
                  size === 'xs' && 'text-sm',
                  size === 'sm' && 'text-lg',
                  size === 'md' && 'text-2xl',
                  size === 'lg' && 'text-3xl',
                  size === 'xl' && 'text-4xl'
                )}
              >
                {initials}
              </span>
            ) : (
              <User className={cn(sizeConfig.icon, 'text-white opacity-70')} />
            )}
          </div>
        )}

        {/* Overlay - Upload/Status */}
        <div
          className={cn(
            'absolute inset-0 flex items-center justify-center transition-all',
            isUploading
              ? 'bg-black/60'
              : uploadStatus === 'success'
              ? 'bg-green-500/60'
              : uploadStatus === 'error'
              ? 'bg-red-500/60'
              : isDragging
              ? 'bg-blue-500/40'
              : 'bg-black/0 hover:bg-black/30'
          )}
        >
          {isUploading ? (
            <Loader2 className={cn(sizeConfig.overlay, 'text-white animate-spin')} />
          ) : uploadStatus === 'success' ? (
            <CheckCircle2 className={cn(sizeConfig.overlay, 'text-white')} />
          ) : uploadStatus === 'error' ? (
            <AlertCircle className={cn(sizeConfig.overlay, 'text-white')} />
          ) : (
            <Camera
              className={cn(
                sizeConfig.overlay,
                'text-white opacity-0 group-hover:opacity-100 transition-opacity',
                (isDragging || !preview) && 'opacity-70'
              )}
            />
          )}
        </div>

        {/* Progress Ring */}
        {isUploading && (
          <svg
            className="absolute inset-0 w-full h-full -rotate-90"
            viewBox="0 0 100 100"
          >
            <circle
              cx="50"
              cy="50"
              r="48"
              fill="none"
              stroke="currentColor"
              strokeWidth="4"
              className="text-white/30"
            />
            <circle
              cx="50"
              cy="50"
              r="48"
              fill="none"
              stroke="currentColor"
              strokeWidth="4"
              strokeLinecap="round"
              className="text-white transition-all duration-300"
              strokeDasharray={`${uploadProgress * 3.02} 302`}
            />
          </svg>
        )}
      </div>

      {/* Progress Bar (Alternative) */}
      {isUploading && size !== 'xs' && size !== 'sm' && (
        <div className="w-full max-w-[200px] h-1.5 bg-gray-200 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-blue-500 to-purple-500 transition-all duration-300 rounded-full"
            style={{ width: `${uploadProgress}%` }}
          />
        </div>
      )}

      {/* Buttons */}
      {showButtons && (
        <div className="flex gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleClick}
            disabled={disabled || isUploading}
            className="gap-2"
          >
            <Upload className="w-4 h-4" />
            {preview ? 'تغییر' : 'انتخاب تصویر'}
          </Button>

          {preview && onDelete && (
            <Button
              type="button"
              variant="destructive"
              size="sm"
              onClick={handleDelete}
              disabled={disabled || isUploading}
              className="gap-2"
            >
              <Trash2 className="w-4 h-4" />
              حذف
            </Button>
          )}
        </div>
      )}

      {/* Hidden File Input */}
      <input
        ref={fileInputRef}
        type="file"
        accept={ALLOWED_TYPES.join(',')}
        onChange={handleInputChange}
        className="hidden"
        disabled={disabled || isUploading}
      />

      {/* Help Text */}
      {showButtons && (
        <p className="text-xs text-gray-500 text-center">
          JPG, PNG, GIF یا WebP • حداکثر 2 مگابایت
        </p>
      )}
    </div>
  )
}

// ============================================
// Export Named
// ============================================

export { AvatarUpload }
export type { AvatarUploadProps, AvatarSize }
















































