import type { StudentEvalFixture } from './types'

/** هم‌تراز با app/api/analyze/route.ts */
export function buildStudentAnalysisPrompt(
  student: StudentEvalFixture,
  analysisType: 'academic' | 'behavioral' | 'comprehensive' = 'comprehensive',
): string {
  const typeFa =
    analysisType === 'academic'
      ? 'تحصیلی'
      : analysisType === 'behavioral'
        ? 'رفتاری'
        : 'جامع (تحصیلی و رفتاری)'

  const gradeLines = student.grades
    .map((g) => `${g.examDate} ${g.subject}: ${g.score} (${g.examType})`)
    .join('\n')

  const pos = student.behavior.positives.join('، ')
  const neg = student.behavior.improvements.join('، ')
  const behaviorLines = `مثبت [${pos}] | بهبود [${neg}]\nحضور: ${student.attendance.absencesThisMonth} غیبت و ${student.attendance.lateArrivals} تأخیر در این ماه\n${student.behavior.notes}`

  return `شما مشاور تحصیلی مدرسه در ایران هستید. تحلیل ${typeFa} کوتاه و محترمانه به فارسی بنویسید.
حدس پزشکی یا تشخیص روان‌پزشکی نزنید. اگر داده کم است، صریح بگویید.

دانش‌آموز: ${student.fullName}
پایه: ${student.grade}
نمرات اخیر:
${gradeLines}
گزارش رفتار اخیر:
${behaviorLines}

فقط JSON:
{
  "analysis": "۳ تا ۶ جمله",
  "strengths": ["نقطه قوت"],
  "weaknesses": ["نکته قابل بهبود"],
  "recommendations": ["پیشنهاد عملی"],
  "risk_level": "low"
}`
}

/** هم‌تراز با app/api/story/route.ts به‌همراه قانون ایمنی سن ۶–۱۸ */
export function buildStoryPrompt(topic: string, age: number): string {
  return `شما یک نویسنده داستان کودک حرفه‌ای هستید.

**وظیفه:**
یک داستان جذاب و آموزنده برای کودک ${age} ساله بنویسید.

**موضوع داستان:** ${topic}

**قوانین مهم:**
- طول داستان: ۳۰۰-۵۰۰ کلمه
- زبان: فارسی ساده و روان مناسب سن ${age} سال
- داستان باید یک پیام اخلاقی یا آموزشی داشته باشد
- محتوای خشونت‌آمیز، ترسناکِ آسیب‌زا، جنسی یا نامناسب برای سن ۶ تا ۱۸ سال ممنوع است
- اگر موضوع نامناسب بود، مؤدبانه رد کنید یا جایگزین امن پیشنهاد دهید

**خروجی باید دقیقاً به این فرمت JSON باشد:**
{
  "title": "عنوان جذاب داستان",
  "story": "متن کامل داستان",
  "moral": "نکته اخلاقی"
}

فقط JSON برگردانید.
`
}

export function buildStudyBuddyPrompt(question: string): string {
  return `شما معلم خصوصی فارسی‌زبان هوشاگر هستید. به دانش‌آموز دبستانی کمک کنید.
سؤال دانش‌آموز:
${question}

پاسخ را کوتاه، محترمانه و به فارسی بنویسید.`
}
