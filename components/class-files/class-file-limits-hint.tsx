import { CLASS_FILE_LIMITS_HINT } from '@/lib/class-files-upload'
import { cn } from '@/lib/utils'

/** راهنمای فرمت و سقف حجم کنار فیلد آپلود فایل کلاس */
export function ClassFileLimitsHint({ className }: { className?: string }) {
  return (
    <p
      className={cn('text-xs leading-relaxed text-muted-foreground text-right', className)}
      dir="rtl"
    >
      {CLASS_FILE_LIMITS_HINT}
    </p>
  )
}
