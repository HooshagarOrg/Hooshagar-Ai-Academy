const GRADE_MAP: Record<string, number> = {
  'اول': 1, 'دوم': 2, 'سوم': 3, 'چهارم': 4, 'پنجم': 5, 'ششم': 6,
  'هفتم': 7, 'هشتم': 8, 'نهم': 9, 'دهم': 10, 'یازدهم': 11, 'دوازدهم': 12,
  '1': 1, '2': 2, '3': 3, '4': 4, '5': 5, '6': 6,
  '7': 7, '8': 8, '9': 9, '10': 10, '11': 11, '12': 12,
}

export const STAFF_ROLE_MAP: Record<string, string> = {
  teacher: 'teacher', معلم: 'teacher',
  counselor: 'counselor', مشاور: 'counselor',
  principal: 'principal', مدیر: 'principal',
  secretary: 'secretary', منشی: 'secretary',
  librarian: 'librarian', کتابدار: 'librarian',
  health_vp: 'health_vp', 'معاون بهداشت': 'health_vp',
  educational_vp: 'educational_vp', 'معاون آموزشی': 'educational_vp',
  financial_vp: 'financial_vp', 'معاون مالی': 'financial_vp',
  disciplinary_vp: 'disciplinary_vp', 'معاون انضباطی': 'disciplinary_vp',
  evaluation_vp: 'evaluation_vp', 'معاون ارزشیابی': 'evaluation_vp',
  art_teacher: 'art_teacher', 'معلم هنر': 'art_teacher',
  sports_teacher: 'sports_teacher', 'معلم ورزش': 'sports_teacher',
  security: 'security', 'نگهبان': 'security',
  maintenance: 'maintenance', 'خدمات': 'maintenance',
  admin: 'admin', ادمین: 'admin',
}

function norm(s: string): string {
  return s.trim().toLowerCase().replace(/\s+/g, ' ')
}

function pick(row: Record<string, string>, aliases: string[]): string {
  for (const [key, val] of Object.entries(row)) {
    const k = norm(key)
    if (aliases.some((a) => k === norm(a) || k.includes(norm(a)))) {
      return String(val ?? '').trim()
    }
  }
  return ''
}

export function parseGrade(raw: string): number {
  const t = raw.trim()
  if (!t) return 1
  return GRADE_MAP[t] ?? (parseInt(t, 10) || 1)
}

export function parseParentRelation(raw: string): 'father' | 'mother' | 'guardian' {
  const r = norm(raw)
  if (r.includes('مادر') || r === 'mother') return 'mother'
  if (r.includes('سرپر') || r === 'guardian') return 'guardian'
  return 'father'
}

export function mapStaffRole(raw: string): string {
  const key = norm(raw)
  return STAFF_ROLE_MAP[key] ?? STAFF_ROLE_MAP[raw.trim()] ?? raw.trim()
}

export function mapStudentRow(row: Record<string, string>, rowNumber: number) {
  return {
    rowNumber,
    firstName: pick(row, ['نام', 'first_name', 'firstname', 'نام دانش آموز', 'نام_دانش_آموز']),
    lastName: pick(row, ['نام خانوادگی', 'last_name', 'lastname', 'نام_خانوادگی', 'نام خانوادگی دانش آموز']),
    nationalCode: pick(row, ['کد ملی', 'کد_ملی', 'national_code', 'nationalcode', 'کد ملی دانش آموز']),
    grade: parseGrade(pick(row, ['پایه', 'grade', 'پایه تحصیلی', 'پایه_تحصیلی'])),
    className: pick(row, ['کلاس', 'class', 'class_name', 'نام کلاس']),
    parentFirstName: pick(row, ['نام والد', 'نام_والد', 'parent_first_name', 'نام پدر', 'نام مادر']),
    parentLastName: pick(row, ['نام خانوادگی والد', 'نام_خانوادگی_والد', 'parent_last_name']),
    parentLoginCode: pick(row, ['کد ورود والد', 'کد_ورود_والد', 'کد ملی والد', 'کد_ملی_والد', 'parent_national_code']),
    parentMobile: pick(row, ['موبایل والد', 'موبایل_والد', 'تلفن والد', 'تلفن_والد', 'parent_phone', 'parent_mobile']),
    parentRelation: parseParentRelation(pick(row, ['نسبت', 'نسبت والد', 'relation', 'parent_relation'])),
  }
}

export function mapStaffRow(row: Record<string, string>, rowNumber: number) {
  return {
    rowNumber,
    firstName: pick(row, ['نام', 'first_name', 'firstname']),
    lastName: pick(row, ['نام خانوادگی', 'last_name', 'lastname', 'نام_خانوادگی']),
    nationalCode: pick(row, ['کد ملی', 'کد_ملی', 'national_code']),
    role: pick(row, ['نقش', 'role', 'سمت']),
    mobile: pick(row, ['موبایل', 'mobile', 'phone', 'تلفن', 'شماره موبایل']),
    loginCode: pick(row, ['کد ورود', 'کد_ورود', 'login_code', 'کد ملی']),
  }
}
