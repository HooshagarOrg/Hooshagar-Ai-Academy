/**
 * نام نمایشی والد وقتی در فایل/فرم نام واقعی نیست.
 * اولویت: نام واردشده → «والد + نام دانش‌آموز» → «والد + کد ورود»
 */
export function resolveParentDisplayName(input: {
  parentFirstName?: string | null
  parentLastName?: string | null
  parentFullName?: string | null
  studentFullName?: string | null
  parentLoginCode?: string | null
  parentPhone?: string | null
}): { name: string; usedFallback: boolean } {
  const explicit = (
    input.parentFullName?.trim() ||
    `${input.parentFirstName || ''} ${input.parentLastName || ''}`.trim()
  ).replace(/\s+/g, ' ')

  if (explicit.length >= 2) {
    return { name: explicit, usedFallback: false }
  }

  const student = input.studentFullName?.trim()
  if (student && student.length >= 2) {
    return { name: `والد ${student}`, usedFallback: true }
  }

  const code = (input.parentLoginCode || input.parentPhone || '').replace(/\D/g, '')
  if (code.length >= 4) {
    return { name: `والد ${code.slice(-4)}`, usedFallback: true }
  }

  return { name: 'والد', usedFallback: true }
}

/** نام‌های موقت ساخته‌شده توسط سیستم — برای تکمیل در ورود اول */
export function isPlaceholderParentName(fullName: string | null | undefined): boolean {
  const name = (fullName || '').trim()
  if (!name) return true
  return /^والد(\s|$)/.test(name)
}
