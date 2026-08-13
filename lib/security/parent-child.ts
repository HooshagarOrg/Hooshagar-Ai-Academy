import { createClient } from '@/lib/supabase/server'

/** والد فقط فرزند خودش را ببیند؛ نقش‌های دیگر بدون تغییر می‌مانند. */
export async function parentOwnsStudent(
  ctx: { userId: string; role: string },
  studentId: string
): Promise<boolean> {
  if (ctx.role !== 'parent') return true
  const supabase = await createClient()
  const { data } = await supabase
    .from('students')
    .select('id')
    .eq('id', studentId)
    .eq('parent_id', ctx.userId)
    .maybeSingle()
  return Boolean(data)
}
