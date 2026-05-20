import { NextResponse } from 'next/server'

// ═══════════════════════════════════════════════════════════════
// هوشاگر — مدیریت متمرکز خطا
// جلوگیری از نشت جزئیات schema/DB به کاربر
// ═══════════════════════════════════════════════════════════════

// نگاشت کدهای خطای PostgreSQL/Supabase به پیام‌های فارسی امن
const PG_ERROR_MAP: Record<string, string> = {
  '23505': 'این رکورد از قبل وجود دارد.',
  '23503': 'رکورد وابسته‌ای یافت نشد.',
  '23514': 'مقدار ورودی معتبر نیست.',
  '42501': 'دسترسی کافی ندارید.',
  '42P01': 'منبع درخواستی یافت نشد.',
  'PGRST116': 'رکورد یافت نشد.',
  'PGRST200': 'عملیات مجاز نیست.',
  'PGRST301': 'دسترسی غیرمجاز.',
}

type SupabaseError = {
  code?: string
  message?: string
  details?: string
  hint?: string
}

/**
 * تبدیل خطای Supabase/PostgreSQL به پیام فارسی امن
 * جزئیات فنی فقط در محیط dev لاگ می‌شوند، نه در پاسخ
 */
export function mapDbError(error: unknown, fallback = 'خطای داخلی سرور'): string {
  if (!error) return fallback

  const err = error as SupabaseError

  // کدهای PostgREST و PostgreSQL
  if (err.code && PG_ERROR_MAP[err.code]) {
    return PG_ERROR_MAP[err.code]
  }

  // خطاهای RLS (Row Level Security)
  if (err.message?.includes('row-level security') || err.message?.includes('RLS')) {
    return 'دسترسی غیرمجاز.'
  }

  // خطاهای JWT
  if (err.message?.includes('JWT') || err.message?.includes('token')) {
    return 'نشست شما منقضی شده. لطفاً دوباره وارد شوید.'
  }

  return fallback
}

/**
 * پاسخ خطای امن — هرگز جزئیات DB را برنمی‌گرداند
 */
export function secureErrorResponse(
  error: unknown,
  {
    fallback = 'خطای داخلی سرور',
    status = 500,
    context = '',
  }: { fallback?: string; status?: number; context?: string } = {}
): NextResponse {
  const message = mapDbError(error, fallback)

  // لاگ جزئیات فنی فقط در سرور
  if (process.env.NODE_ENV !== 'production') {
    console.error(`[SecurityError]${context ? ' ' + context : ''}:`, error)
  } else {
    console.error(`[SecurityError]${context ? ' ' + context : ''}: hidden in production`)
  }

  return NextResponse.json({ error: message }, { status })
}

/**
 * پاسخ استاندارد برای خطاهای احراز هویت
 */
export const AUTH_ERRORS = {
  unauthorized: () =>
    NextResponse.json({ error: 'لطفاً ابتدا وارد شوید.' }, { status: 401 }),
  forbidden: () =>
    NextResponse.json({ error: 'دسترسی غیرمجاز.' }, { status: 403 }),
  notFound: (resource = 'مورد') =>
    NextResponse.json({ error: `${resource} یافت نشد.` }, { status: 404 }),
}
