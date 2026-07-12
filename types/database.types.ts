// =====================================
// Database Types (Supabase)
// =====================================
// تا اجرای `pnpm run generate-types` از تایپ باز استفاده می‌شود
// تا کوئری‌های `.from('...')` به never تبدیل نشوند.

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface ProfileRow {
  id: string
  email?: string | null
  full_name: string | null
  role: string
  school_id: string | null
  must_change_password?: boolean | null
  ui_theme?: 'light' | 'dark' | null
  [key: string]: unknown
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type Database = any
