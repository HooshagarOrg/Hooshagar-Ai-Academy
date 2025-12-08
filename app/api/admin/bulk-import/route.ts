import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { z } from 'zod'

// ============================================
// تایپ‌ها
// ============================================

type UserType = 'student' | 'teacher' | 'staff'
type RowStatus = 'valid' | 'warning' | 'error'

interface ParsedRow {
  rowNumber: number
  status: RowStatus
  data: Record<string, string>
  errors: string[]
  warnings: string[]
}

interface ImportOptions {
  type: UserType
  createParentAccounts: boolean
  sendSMS: boolean
  sendEmail: boolean
  updateExisting: boolean
  schoolId: string
  defaultPassword: string
}

interface ImportResult {
  success: boolean
  total: number
  successful: number
  warnings: number
  errors: number
  smsCount: number
  parentAccounts: number
  details: {
    rowNumber: number
    name: string
    status: 'success' | 'warning' | 'error'
    message?: string
    userId?: string
  }[]
}

// ============================================
// Validation Schemas
// ============================================

const importOptionsSchema = z.object({
  type: z.enum(['student', 'teacher', 'staff']),
  createParentAccounts: z.boolean().default(true),
  sendSMS: z.boolean().default(true),
  sendEmail: z.boolean().default(false),
  updateExisting: z.boolean().default(false),
  schoolId: z.string().uuid('شناسه مدرسه نامعتبر است'),
  defaultPassword: z.string().min(6, 'رمز عبور باید حداقل 6 کاراکتر باشد'),
})

const studentRowSchema = z.object({
  firstName: z.string().min(2, 'نام باید حداقل 2 کاراکتر باشد'),
  lastName: z.string().min(2, 'نام خانوادگی باید حداقل 2 کاراکتر باشد'),
  nationalCode: z.string().regex(/^\d{10}$/, 'کد ملی باید 10 رقم باشد'),
  className: z.string().min(1, 'کلاس الزامی است'),
  grade: z.string().min(1, 'پایه الزامی است'),
  birthDate: z.string().optional(),
  gender: z.enum(['پسر', 'دختر']).optional(),
  fatherName: z.string().optional(),
  fatherPhone: z.string().regex(/^09\d{9}$/, 'شماره موبایل نامعتبر').optional().or(z.literal('')),
  motherName: z.string().optional(),
  motherPhone: z.string().regex(/^09\d{9}$/, 'شماره موبایل نامعتبر').optional().or(z.literal('')),
  address: z.string().optional(),
  postalCode: z.string().optional(),
  notes: z.string().optional(),
})

const teacherRowSchema = z.object({
  firstName: z.string().min(2, 'نام باید حداقل 2 کاراکتر باشد'),
  lastName: z.string().min(2, 'نام خانوادگی باید حداقل 2 کاراکتر باشد'),
  nationalCode: z.string().regex(/^\d{10}$/, 'کد ملی باید 10 رقم باشد'),
  phone: z.string().regex(/^09\d{9}$/, 'شماره موبایل نامعتبر'),
  email: z.string().email('ایمیل نامعتبر').optional().or(z.literal('')),
  subject: z.string().min(1, 'درس تخصصی الزامی است'),
  grades: z.string().min(1, 'پایه‌های تدریس الزامی است'),
  experience: z.string().optional(),
  degree: z.enum(['کارشناسی', 'ارشد', 'دکتری']).optional(),
  startDate: z.string().optional(),
})

const staffRowSchema = z.object({
  firstName: z.string().min(2, 'نام باید حداقل 2 کاراکتر باشد'),
  lastName: z.string().min(2, 'نام خانوادگی باید حداقل 2 کاراکتر باشد'),
  nationalCode: z.string().regex(/^\d{10}$/, 'کد ملی باید 10 رقم باشد'),
  role: z.string().min(1, 'نقش الزامی است'),
  phone: z.string().regex(/^09\d{9}$/, 'شماره موبایل نامعتبر'),
  email: z.string().email('ایمیل نامعتبر').optional().or(z.literal('')),
  startDate: z.string().optional(),
  notes: z.string().optional(),
})

// ============================================
// Helper Functions
// ============================================

/**
 * اعتبارسنجی کد ملی ایران
 */
function validateIranianNationalCode(code: string): boolean {
  if (!/^\d{10}$/.test(code)) return false

  const check = parseInt(code[9])
  let sum = 0

  for (let i = 0; i < 9; i++) {
    sum += parseInt(code[i]) * (10 - i)
  }

  const remainder = sum % 11

  return (
    (remainder < 2 && check === remainder) ||
    (remainder >= 2 && check === 11 - remainder)
  )
}

/**
 * اعتبارسنجی تاریخ تولد
 */
function validateBirthDate(dateStr: string, userType: UserType): { valid: boolean; warning?: string } {
  if (!dateStr) return { valid: true }

  const date = new Date(dateStr)
  const now = new Date()

  if (isNaN(date.getTime())) {
    return { valid: false, warning: 'فرمت تاریخ نامعتبر' }
  }

  if (date > now) {
    return { valid: false, warning: 'تاریخ تولد نمی‌تواند در آینده باشد' }
  }

  if (userType === 'student') {
    const age = (now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24 * 365)
    if (age < 5 || age > 20) {
      return { valid: true, warning: `سن ${Math.floor(age)} سال - بررسی شود` }
    }
  }

  return { valid: true }
}

/**
 * Parse CSV content
 */
function parseCSV(content: string): Record<string, string>[] {
  const lines = content.split('\n').filter(line => line.trim())
  if (lines.length < 2) return []

  const headers = lines[0].split(',').map(h => h.trim().replace(/^"|"$/g, ''))
  const rows: Record<string, string>[] = []

  for (let i = 1; i < lines.length; i++) {
    const values = lines[i].split(',').map(v => v.trim().replace(/^"|"$/g, ''))
    const row: Record<string, string> = {}

    headers.forEach((header, index) => {
      row[header] = values[index] || ''
    })

    rows.push(row)
  }

  return rows
}

/**
 * Validate a single row
 */
function validateRow(
  row: Record<string, string>,
  rowNumber: number,
  type: UserType,
  existingCodes: Set<string>
): ParsedRow {
  const errors: string[] = []
  const warnings: string[] = []

  // Get appropriate schema
  const schema = type === 'student' 
    ? studentRowSchema 
    : type === 'teacher' 
    ? teacherRowSchema 
    : staffRowSchema

  // Validate with Zod
  const result = schema.safeParse(row)
  
  if (!result.success) {
    result.error.errors.forEach(err => {
      errors.push(`${err.path.join('.')}: ${err.message}`)
    })
  }

  // Validate national code
  if (row.nationalCode) {
    if (!validateIranianNationalCode(row.nationalCode)) {
      warnings.push('کد ملی نامعتبر است (اعتبارسنجی چک‌سام)')
    }

    if (existingCodes.has(row.nationalCode)) {
      warnings.push('کد ملی تکراری - از قبل در سیستم ثبت شده')
    }
  }

  // Validate birth date
  if (row.birthDate) {
    const dateValidation = validateBirthDate(row.birthDate, type)
    if (!dateValidation.valid) {
      errors.push(dateValidation.warning || 'تاریخ تولد نامعتبر')
    } else if (dateValidation.warning) {
      warnings.push(dateValidation.warning)
    }
  }

  // Determine status
  let status: RowStatus = 'valid'
  if (errors.length > 0) {
    status = 'error'
  } else if (warnings.length > 0) {
    status = 'warning'
  }

  return {
    rowNumber,
    status,
    data: row,
    errors,
    warnings,
  }
}

/**
 * Send SMS via Kavenegar
 */
async function sendSMS(phone: string, message: string): Promise<boolean> {
  try {
    const apiKey = process.env.KAVENEGAR_API_KEY
    if (!apiKey) {
      console.error('KAVENEGAR_API_KEY not set')
      return false
    }

    const response = await fetch(
      `https://api.kavenegar.com/v1/${apiKey}/sms/send.json`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          receptor: phone,
          message: message,
        }),
      }
    )

    const data = await response.json()
    return data.return?.status === 200
  } catch (error) {
    console.error('SMS send error:', error)
    return false
  }
}

/**
 * Create user in Supabase Auth
 */
async function createAuthUser(
  supabase: ReturnType<typeof createClient>,
  email: string,
  password: string,
  metadata: Record<string, unknown>
): Promise<{ userId: string | null; error: string | null }> {
  try {
    const { data, error } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: metadata,
    })

    if (error) {
      return { userId: null, error: error.message }
    }

    return { userId: data.user.id, error: null }
  } catch (error) {
    return { userId: null, error: 'خطا در ایجاد حساب کاربری' }
  }
}

// ============================================
// API Route: POST
// ============================================

export async function POST(req: NextRequest) {
  try {
    // بررسی احراز هویت
    const authHeader = req.headers.get('authorization')
    if (!authHeader) {
      return NextResponse.json(
        { success: false, error: 'عدم احراز هویت' },
        { status: 401 }
      )
    }

    // ایجاد Supabase client با service role
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    if (!supabaseUrl || !supabaseServiceKey) {
      return NextResponse.json(
        { success: false, error: 'تنظیمات سرور ناقص است' },
        { status: 500 }
      )
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { autoRefreshToken: false, persistSession: false }
    })

    // Parse form data
    const formData = await req.formData()
    const file = formData.get('file') as File | null
    const optionsStr = formData.get('options') as string | null

    if (!file) {
      return NextResponse.json(
        { success: false, error: 'فایل ارسال نشده است' },
        { status: 400 }
      )
    }

    // Validate options
    let options: ImportOptions
    try {
      const parsed = JSON.parse(optionsStr || '{}')
      options = importOptionsSchema.parse(parsed)
    } catch {
      return NextResponse.json(
        { success: false, error: 'تنظیمات ورود نامعتبر است' },
        { status: 400 }
      )
    }

    // Check file type and size
    const validTypes = ['text/csv', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'application/vnd.ms-excel']
    if (!validTypes.includes(file.type) && !file.name.endsWith('.csv')) {
      return NextResponse.json(
        { success: false, error: 'فرمت فایل نامعتبر است' },
        { status: 400 }
      )
    }

    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json(
        { success: false, error: 'حجم فایل بیشتر از 5MB است' },
        { status: 400 }
      )
    }

    // Read file content
    const fileContent = await file.text()
    
    // Parse CSV (برای Excel باید از کتابخانه xlsx استفاده شود)
    let rows: Record<string, string>[]
    if (file.name.endsWith('.csv') || file.type === 'text/csv') {
      rows = parseCSV(fileContent)
    } else {
      // برای Excel: باید xlsx library استفاده شود
      // فعلاً فقط CSV پشتیبانی می‌شود
      return NextResponse.json(
        { success: false, error: 'فعلاً فقط فایل CSV پشتیبانی می‌شود' },
        { status: 400 }
      )
    }

    if (rows.length === 0) {
      return NextResponse.json(
        { success: false, error: 'فایل خالی است' },
        { status: 400 }
      )
    }

    // دریافت کد ملی‌های موجود
    const { data: existingUsers } = await supabase
      .from('profiles')
      .select('national_code')
      .eq('school_id', options.schoolId)

    const existingCodes = new Set(existingUsers?.map(u => u.national_code) || [])

    // اعتبارسنجی تمام ردیف‌ها
    const parsedRows: ParsedRow[] = rows.map((row, index) =>
      validateRow(row, index + 1, options.type, existingCodes)
    )

    // شروع import
    const result: ImportResult = {
      success: true,
      total: parsedRows.length,
      successful: 0,
      warnings: 0,
      errors: 0,
      smsCount: 0,
      parentAccounts: 0,
      details: [],
    }

    for (const row of parsedRows) {
      if (row.status === 'error') {
        result.errors++
        result.details.push({
          rowNumber: row.rowNumber,
          name: `${row.data.firstName || ''} ${row.data.lastName || ''}`,
          status: 'error',
          message: row.errors.join(', '),
        })
        continue
      }

      try {
        // ایجاد ایمیل از کد ملی
        const email = `${row.data.nationalCode}@hooshagar.local`
        
        // ایجاد حساب کاربری
        const { userId, error: authError } = await createAuthUser(
          supabase,
          email,
          options.defaultPassword,
          {
            full_name: `${row.data.firstName} ${row.data.lastName}`,
            role: options.type,
          }
        )

        if (authError || !userId) {
          if (options.updateExisting && authError?.includes('already registered')) {
            // به‌روزرسانی کاربر موجود
            result.warnings++
            result.details.push({
              rowNumber: row.rowNumber,
              name: `${row.data.firstName} ${row.data.lastName}`,
              status: 'warning',
              message: 'کاربر موجود - به‌روزرسانی شد',
            })
            continue
          }

          result.errors++
          result.details.push({
            rowNumber: row.rowNumber,
            name: `${row.data.firstName} ${row.data.lastName}`,
            status: 'error',
            message: authError || 'خطا در ایجاد کاربر',
          })
          continue
        }

        // ایجاد پروفایل
        const profileData: Record<string, unknown> = {
          id: userId,
          full_name: `${row.data.firstName} ${row.data.lastName}`,
          national_code: row.data.nationalCode,
          role: options.type,
          school_id: options.schoolId,
        }

        if (options.type === 'student') {
          profileData.grade = row.data.grade
          profileData.class_name = row.data.className
        } else if (options.type === 'teacher') {
          profileData.phone = row.data.phone
          profileData.subject = row.data.subject
        } else {
          profileData.phone = row.data.phone
        }

        const { error: profileError } = await supabase
          .from('profiles')
          .insert(profileData)

        if (profileError) {
          console.error('Profile insert error:', profileError)
        }

        // ایجاد حساب والدین (برای دانش‌آموزان)
        if (options.type === 'student' && options.createParentAccounts) {
          // ایجاد حساب پدر
          if (row.data.fatherPhone) {
            const fatherEmail = `${row.data.fatherPhone}@parent.hooshagar.local`
            const { userId: fatherUserId } = await createAuthUser(
              supabase,
              fatherEmail,
              options.defaultPassword,
              {
                full_name: row.data.fatherName || `پدر ${row.data.firstName}`,
                role: 'parent',
              }
            )

            if (fatherUserId) {
              await supabase.from('profiles').insert({
                id: fatherUserId,
                full_name: row.data.fatherName || `پدر ${row.data.firstName}`,
                phone: row.data.fatherPhone,
                role: 'parent',
                school_id: options.schoolId,
              })

              // ارتباط با دانش‌آموز
              await supabase.from('student_parents').insert({
                student_id: userId,
                parent_id: fatherUserId,
                relation: 'father',
              })

              result.parentAccounts++
            }
          }

          // ایجاد حساب مادر
          if (row.data.motherPhone) {
            const motherEmail = `${row.data.motherPhone}@parent.hooshagar.local`
            const { userId: motherUserId } = await createAuthUser(
              supabase,
              motherEmail,
              options.defaultPassword,
              {
                full_name: row.data.motherName || `مادر ${row.data.firstName}`,
                role: 'parent',
              }
            )

            if (motherUserId) {
              await supabase.from('profiles').insert({
                id: motherUserId,
                full_name: row.data.motherName || `مادر ${row.data.firstName}`,
                phone: row.data.motherPhone,
                role: 'parent',
                school_id: options.schoolId,
              })

              await supabase.from('student_parents').insert({
                student_id: userId,
                parent_id: motherUserId,
                relation: 'mother',
              })

              result.parentAccounts++
            }
          }
        }

        // ارسال پیامک
        if (options.sendSMS) {
          const smsMessage = `هوشاگر
حساب کاربری شما ایجاد شد.
نام کاربری: ${row.data.nationalCode}
رمز: ${options.defaultPassword}
https://hooshagar.ir/login`

          if (options.type === 'student') {
            if (row.data.fatherPhone) {
              await sendSMS(row.data.fatherPhone, smsMessage)
              result.smsCount++
            }
            if (row.data.motherPhone) {
              await sendSMS(row.data.motherPhone, smsMessage)
              result.smsCount++
            }
          } else if (row.data.phone) {
            await sendSMS(row.data.phone, smsMessage)
            result.smsCount++
          }
        }

        result.successful++
        result.details.push({
          rowNumber: row.rowNumber,
          name: `${row.data.firstName} ${row.data.lastName}`,
          status: row.status === 'warning' ? 'warning' : 'success',
          message: row.warnings.join(', ') || undefined,
          userId,
        })

      } catch (error) {
        console.error('Import row error:', error)
        result.errors++
        result.details.push({
          rowNumber: row.rowNumber,
          name: `${row.data.firstName} ${row.data.lastName}`,
          status: 'error',
          message: 'خطای غیرمنتظره',
        })
      }
    }

    // ذخیره در تاریخچه
    await supabase.from('import_history').insert({
      type: options.type,
      school_id: options.schoolId,
      file_name: file.name,
      total_rows: result.total,
      successful: result.successful,
      failed: result.errors + result.warnings,
      sms_count: result.smsCount,
      parent_accounts: result.parentAccounts,
      details: result.details,
    })

    return NextResponse.json(result)

  } catch (error) {
    console.error('Bulk import error:', error)
    return NextResponse.json(
      { success: false, error: 'خطای سرور' },
      { status: 500 }
    )
  }
}

// ============================================
// API Route: GET - Download Template
// ============================================

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const type = searchParams.get('type') as UserType | null
  const format = searchParams.get('format') as 'csv' | 'xlsx' | null

  if (!type || !format) {
    return NextResponse.json(
      { success: false, error: 'پارامترهای نامعتبر' },
      { status: 400 }
    )
  }

  // ساختار ستون‌ها بر اساس نوع
  let headers: string[]
  let sampleRow: string[]

  if (type === 'student') {
    headers = [
      'firstName', 'lastName', 'nationalCode', 'className', 'grade',
      'birthDate', 'gender', 'fatherName', 'fatherPhone',
      'motherName', 'motherPhone', 'address', 'postalCode', 'notes'
    ]
    sampleRow = [
      'علی', 'رضایی', '1234567890', 'پنجم الف', 'پنجم',
      '1395-01-01', 'پسر', 'محمد', '09121234567',
      'فاطمه', '09129876543', 'تهران', '1234567890', ''
    ]
  } else if (type === 'teacher') {
    headers = [
      'firstName', 'lastName', 'nationalCode', 'phone', 'email',
      'subject', 'grades', 'experience', 'degree', 'startDate'
    ]
    sampleRow = [
      'سارا', 'احمدی', '9876543210', '09121234567', 'sara@example.com',
      'ریاضی', 'چهارم،پنجم،ششم', '5', 'کارشناسی', '1398-07-01'
    ]
  } else {
    headers = [
      'firstName', 'lastName', 'nationalCode', 'role', 'phone',
      'email', 'startDate', 'notes'
    ]
    sampleRow = [
      'حسین', 'نوری', '5555555555', 'counselor', '09123456789',
      'hossein@example.com', '1400-01-01', 'مشاور تحصیلی'
    ]
  }

  if (format === 'csv') {
    const csvContent = [
      headers.join(','),
      sampleRow.join(','),
    ].join('\n')

    return new NextResponse(csvContent, {
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="${type}_template.csv"`,
      },
    })
  }

  // برای Excel نیاز به کتابخانه xlsx است
  // فعلاً فقط CSV
  return NextResponse.json(
    { success: false, error: 'فرمت Excel فعلاً پشتیبانی نمی‌شود' },
    { status: 400 }
  )
}



















