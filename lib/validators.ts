import { z } from 'zod'

// =====================================
// Zod Schemas برای Validation
// =====================================

// =====================================
// User & Auth Schemas
// =====================================

export const loginSchema = z.object({
  email: z.string().email('ایمیل نامعتبر است'),
  password: z.string().min(6, 'رمز عبور باید حداقل 6 کاراکتر باشد'),
})

export const registerSchema = z.object({
  email: z.string().email('ایمیل نامعتبر است'),
  password: z
    .string()
    .min(8, 'رمز عبور باید حداقل 8 کاراکتر باشد')
    .regex(/[A-Z]/, 'رمز عبور باید حداقل یک حرف بزرگ داشته باشد')
    .regex(/[a-z]/, 'رمز عبور باید حداقل یک حرف کوچک داشته باشد')
    .regex(/[0-9]/, 'رمز عبور باید حداقل یک عدد داشته باشد'),
  full_name: z.string().min(2, 'نام باید حداقل 2 کاراکتر باشد').max(100),
  role: z.enum(['teacher', 'parent', 'student', 'admin']),
})

// =====================================
// Student Schemas
// =====================================

export const studentSchema = z.object({
  full_name: z.string().min(2, 'نام باید حداقل 2 کاراکتر باشد').max(100),
  grade: z.number().int().min(1, 'پایه باید بین 1 و 12 باشد').max(12),
  class_id: z.string().uuid('شناسه کلاس نامعتبر است').optional(),
  parent_email: z.string().email('ایمیل والدین نامعتبر است').optional(),
  metadata: z.record(z.unknown()).optional(),
})

export const updateStudentSchema = studentSchema.partial()

// =====================================
// Grade Schemas
// =====================================

export const gradeSchema = z.object({
  student_id: z.string().uuid(),
  subject: z.string().min(2, 'نام درس باید حداقل 2 کاراکتر باشد'),
  score: z.number().min(0, 'نمره نمی‌تواند منفی باشد').max(20, 'نمره حداکثر 20 است'),
  exam_type: z.enum(['midterm', 'final', 'quiz', 'homework']),
  exam_date: z.string().datetime(),
})

// =====================================
// Attendance Schemas
// =====================================

export const attendanceSchema = z.object({
  student_id: z.string().uuid(),
  date: z.string().date(),
  status: z.enum(['present', 'absent', 'late', 'excused']),
})

// =====================================
// AI Feature Schemas
// =====================================

export const analyzeRequestSchema = z.object({
  studentId: z.string().uuid('شناسه دانش‌آموز نامعتبر است'),
  analysisType: z.enum(['academic', 'behavioral', 'psychological'], {
    errorMap: () => ({ message: 'نوع تحلیل باید یکی از academic, behavioral, psychological باشد' }),
  }),
  dateRange: z.object({
    from: z.string().datetime(),
    to: z.string().datetime(),
  }),
  useFallback: z.boolean().optional(),
})

export const ocrRequestSchema = z.object({
  image: z
    .string()
    .regex(/^data:image\/(jpeg|jpg|png);base64,/, 'فرمت تصویر باید JPEG یا PNG باشد'),
  subject: z.string().optional(),
})

export const ragQuerySchema = z.object({
  studentId: z.string().uuid(),
  question: z.string().min(5, 'سوال باید حداقل 5 کاراکتر باشد').max(500),
  bookId: z.string().uuid(),
})

export const storyWizardSchema = z.object({
  studentId: z.string().uuid(),
  targetWeakness: z.string().min(2, 'موضوع باید حداقل 2 کاراکتر باشد'),
  grade: z.number().int().min(1).max(12),
})

// =====================================
// Talent Garden Schemas
// =====================================

export const addXPSchema = z.object({
  studentId: z.string().uuid(),
  xpAmount: z.number().int().positive('مقدار XP باید مثبت باشد'),
  reason: z.string().min(3, 'دلیل باید حداقل 3 کاراکتر باشد'),
})

// =====================================
// Type Inference از Schemas
// =====================================

export type LoginInput = z.infer<typeof loginSchema>
export type RegisterInput = z.infer<typeof registerSchema>
export type StudentInput = z.infer<typeof studentSchema>
export type UpdateStudentInput = z.infer<typeof updateStudentSchema>
export type GradeInput = z.infer<typeof gradeSchema>
export type AttendanceInput = z.infer<typeof attendanceSchema>
export type AnalyzeRequest = z.infer<typeof analyzeRequestSchema>
export type OCRRequest = z.infer<typeof ocrRequestSchema>
export type RAGQuery = z.infer<typeof ragQuerySchema>
export type StoryWizardRequest = z.infer<typeof storyWizardSchema>
export type AddXPRequest = z.infer<typeof addXPSchema>

