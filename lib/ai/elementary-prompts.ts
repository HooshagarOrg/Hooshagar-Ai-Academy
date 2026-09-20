import {
  educationCycleFromGrade,
  type EducationCycle,
  EDUCATION_CYCLE_LABELS,
} from '@/lib/education/cycle'
import { resolveSystemInstruction } from '@/lib/ai/prompt-safety'

const GRADE_LABELS: Record<number, string> = {
  1: 'اول',
  2: 'دوم',
  3: 'سوم',
  4: 'چهارم',
  5: 'پنجم',
  6: 'ششم',
  7: 'هفتم',
  8: 'هشتم',
  9: 'نهم',
  10: 'دهم',
  11: 'یازدهم',
  12: 'دوازدهم',
}

export function gradeLabelFa(grade: number): string {
  return GRADE_LABELS[grade] ?? String(grade)
}

export function buildStudentAiContext(grade: number, subject?: string): string {
  const cycle = educationCycleFromGrade(grade)
  const cycleLabel = EDUCATION_CYCLE_LABELS[cycle]
  const parts = [
    `پایهٔ ${gradeLabelFa(grade)} (${cycleLabel})`,
    subject ? `درس: ${subject}` : null,
  ].filter(Boolean)
  return parts.join(' · ')
}

export function practicePlaygroundSystemPrompt(grade: number, subject: string): string {
  const cycle = educationCycleFromGrade(grade)
  const base = resolveSystemInstruction()
  const level =
    cycle === 'elementary_1'
      ? 'کودک ۶–۸ سال؛ جملات کوتاه، مثال تصویری، بدون اصطلاح سخت.'
      : cycle === 'elementary_2'
        ? 'کودک ۹–۱۱ سال؛ ساده و تشویقی، یک تمرین در هر پاسخ.'
        : 'نوجوان؛ مرحله‌به‌مرحله و شفاف.'

  return `${base}
نقش: معلم بازی‌آموز برای ${buildStudentAiContext(grade, subject)}.
${level}
یک سوال یا تمرین کوتاه بده، بعد از پاسخ دانش‌آموز بازخورد مهربان بده.`
}

export function aiGuidanceSystemPrompt(grade: number): string {
  const cycle = educationCycleFromGrade(grade)
  const base = resolveSystemInstruction()

  if (cycle === 'elementary_1' || cycle === 'elementary_2') {
    return `${base}
نقش: راهنمای مطالعهٔ مهربان برای ${buildStudentAiContext(grade)}.
به والدین و دانش‌آموز کمک کن: زمان مطالعهٔ کوتاه، استراحت، تمرکز، عادت خواندن.
از کنکور، رشته و شغل صحبت نکن. زبان ساده و عملی.`
  }

  return `${base}
نقش: راهنمای مطالعه برای ${buildStudentAiContext(grade)}.
برنامهٔ هفتگی، مدیریت زمان، روش مطالعه و کاهش استرس امتحان را پیشنهاد بده.`
}

export function futureCompassSystemPrompt(grade: number): string {
  const cycle = educationCycleFromGrade(grade)
  const base = resolveSystemInstruction()

  if (cycle === 'elementary_1' || cycle === 'elementary_2') {
    return `${base}
نقش: کشف علایق و استعداد برای ${buildStudentAiContext(grade)}.
با سوال‌های ساده علایق (هنر، ورزش، کتاب، طبیعت) را کشف کن.
از شغل و کنکور صحبت نکن؛ روی کشف علایق و تقویت اعتماد‌به‌نفس تمرکز کن.`
  }

  return `${base}
نقش: قطب‌نمای آینده برای ${buildStudentAiContext(grade)}.
علایق، نقاط قوت و مسیرهای تحصیلی مناسب را با زبان نوجوان توضیح بده.`
}

export function futureCompassTitle(cycle: EducationCycle): string {
  if (cycle === 'elementary_1' || cycle === 'elementary_2') {
    return 'کشف علایق و استعداد'
  }
  return 'قطب‌نمای آینده'
}

export function aiGuidanceTitle(cycle: EducationCycle): string {
  if (cycle === 'elementary_1' || cycle === 'elementary_2') {
    return 'راهنمای مطالعه'
  }
  return 'راهنمای AI'
}
