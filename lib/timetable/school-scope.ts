/** ادمین کل مدرسهٔ پروفایل ندارد؛ باید school_id را صریح بفرستد. */
export function resolveTimetableSchoolId(
  ctxSchoolId: string | null,
  role: string,
  requestedSchoolId: string | null
): string | null {
  if (role === 'platform_admin') {
    return requestedSchoolId || ctxSchoolId
  }
  return ctxSchoolId
}

export function isUniqueViolation(error: { code?: string; message?: string } | null): boolean {
  if (!error) return false
  return error.code === '23505' || /duplicate key|unique/i.test(error.message || '')
}
