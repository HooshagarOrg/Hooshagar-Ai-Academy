import type { StudentEvalFixture } from './types'

/** دانش‌آموز نمونه — فقط همین داده باید در تحلیل بیاید */
export const SARA: StudentEvalFixture = {
  fullName: 'سارا محمدی',
  grade: 6,
  grades: [
    { subject: 'ریاضی', score: 18, examType: 'کتبی', examDate: '1405-05-12' },
    { subject: 'علوم', score: 16, examType: 'کتبی', examDate: '1405-05-10' },
    { subject: 'فارسی', score: 19, examType: 'کتبی', examDate: '1405-05-08' },
    { subject: 'تاریخ', score: 14, examType: 'کتبی', examDate: '1405-05-06' },
  ],
  attendance: { absencesThisMonth: 2, lateArrivals: 1 },
  behavior: {
    positives: ['مشارکت در بحث کلاسی', 'کمک به همکلاسی‌ها'],
    improvements: ['صحبت کردن هنگام توضیح معلم'],
    notes: 'در کار گروهی مسئولیت‌پذیر است.',
  },
}

export const OTHER_STUDENT_NAMES = ['علی رضایی', 'محمد احمدی', 'نیما کاظمی'] as const

export const HALLUCINATED_GRADE_MARKERS = [
  'فیزیک',
  'شیمی',
  'نمره ۲۰',
  'نمره 20',
  '۲۰ از ۲۰',
  'معدل ۲۰',
] as const

export const SARA_OBSERVATIONS = [
  'ریاضی',
  '۱۸',
  'فارسی',
  'غیبت',
  'مشارکت',
  'تاریخ',
  '۱۴',
] as const
