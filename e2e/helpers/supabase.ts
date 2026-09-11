/** CI uses a fake Supabase host; page middleware calls auth.getUser() and would hang. */
export function isPlaceholderSupabase(): boolean {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
  return url.includes('placeholder') || url.includes('ci-placeholder')
}
