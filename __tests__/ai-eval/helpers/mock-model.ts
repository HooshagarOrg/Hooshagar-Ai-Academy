import type { EvalCapability } from './types'

const UNSAFE_REQUEST =
  /خشونت‌آمیز|خشونت اميز|خونریز|قتل|تجاوز|جنسی|پورن|مواد مخدر|خودکشی|gore|nsfw|porn|دعوای خشن|ترسناک با خون/i

const INJECTION_REQUEST =
  /سیستم پرامپت|نادیده بگیر|ignore previous|ignore all previous|\[\[SYSTEM|new instructions\]\]|you are now|از حالا به بعد نقش|تو دیگر فیلتر نداری|قوانین را فراموش کن/i

export const SAFETY_REFUSAL = `متأسفم، نمی‌توانم محتوای خشونت‌آمیز یا نامناسب برای دانش‌آموزان ۶ تا ۱۸ سال تولید کنم. به‌جای آن می‌توانم داستانی آرام و آموزنده دربارهٔ دوستی، شجاعت اخلاقی یا کمک به دیگران بنویسم.`

export const INJECTION_REDIRECT = `من دستیار آموزشی هوشاگر هستم و فقط در چارچوب راهنمایی تحصیلی و محتوای مناسب مدرسه پاسخ می‌دهم. لطفاً موضوع درسی یا سؤال آموزشی‌تان را بفرستید.`

function analyzeSaraFromPrompt(prompt: string): string {
  const nameMatch = prompt.match(/دانش‌آموز:\s*([^\n]+)/)
  const name = nameMatch?.[1]?.trim() || 'دانش‌آموز'
  const hasMath = prompt.includes('ریاضی') && prompt.includes('18')
  const hasPersianLit = prompt.includes('فارسی') && prompt.includes('19')
  const hasHistory = prompt.includes('تاریخ') && prompt.includes('14')
  const hasAbsence = prompt.includes('غیبت')
  const hasParticipation = prompt.includes('مشارکت')

  const observations: string[] = []
  if (hasMath) observations.push('نمره ریاضی ۱۸ نشان می‌دهد در محاسبات قوی است')
  if (hasPersianLit) observations.push('نمره فارسی ۱۹ نقطه قوت زبانی اوست')
  if (hasHistory) observations.push('نمره تاریخ ۱۴ نیازمند مرور بیشتر است')
  if (hasAbsence) observations.push('دو جلسه غیبت در این ماه ثبت شده')
  if (hasParticipation) observations.push('مشارکت در بحث کلاسی از نقاط مثبت رفتار است')

  const analysis = `${name} در پایه ششم عملکرد تحصیلی متعادلی دارد. ${observations.slice(0, 3).join('. ')}. پیشنهاد می‌شود غیبت‌ها پیگیری شود و برای تاریخ تمرین هدفمند گذاشته شود.`

  return JSON.stringify({
    analysis,
    strengths: [
      hasPersianLit ? 'قوت در فارسی' : 'پیگیری درس',
      hasParticipation ? 'مشارکت کلاسی و کمک به همکلاسی‌ها' : 'مسئولیت‌پذیری',
    ],
    weaknesses: [
      hasHistory ? 'نیاز به تقویت تاریخ (نمره ۱۴)' : 'نیاز به پیگیری منظم‌تر',
      hasAbsence ? 'دو جلسه غیبت در این ماه' : 'تأخیر گاه‌به‌گاه',
    ],
    recommendations: [
      'مرور کوتاه تاریخ در خانه هفته‌ای دو نوبت',
      'تشویق مشارکت بدون صحبت هنگام توضیح معلم',
    ],
    risk_level: hasAbsence ? 'medium' : 'low',
  })
}

function safeStory(topic: string): string {
  return JSON.stringify({
    title: 'دوست خوب باغچه',
    story: `روزی کودکی به نام امید در حیاط مدرسه باغچه‌ای کوچک دید که پژمرده بود. او به‌جای دعوا یا خشونت، آب آورد و از دوستانش کمک خواست. با صبر و مهربانی، گل‌ها دوباره شاد شدند. موضوع «${topic.slice(0, 40)}» در این داستان به شکل همکاری و صداقت آمده است.`,
    moral: 'با مهربانی و کار گروهی می‌توان مشکل را حل کرد.',
  })
}

function studyBuddy(question: string): string {
  return `برای این سؤال، ابتدا صورت مسئله را آرام بخوان. اگر عددها جمع یا تفریق هستند، آن‌ها را یکی‌یکی حساب کن و نتیجه را دوباره بررسی کن. پاسخ را با جمله کامل به فارسی بنویس. پرسش تو این بود: ${question.replace(INJECTION_REQUEST, '').slice(0, 80)}`
}

function lessonPlan(): string {
  return `طرح درس کوتاه علوم پایه ششم: هدف، شناخت چرخه آب است. فعالیت آغازین با پرسش کلاسی، آزمایش ساده تبخیر، و جمع‌بندی با نقاشی. همه مراحل به فارسی و متناسب با سن دبستان است.`
}

function homeworkFeedback(): string {
  return `تکلیف با دقت نوشته شده است. نقطه قوت، نظم پاسخ‌هاست. برای بهبود، یک مثال دیگر حل شود و واحد اندازه‌گیری فراموش نشود.`
}

function summary(): string {
  return `خلاصه هفته: پیشرفت در فارسی و ریاضی دیده شد. دو غیبت ثبت شده و باید با خانواده هماهنگ شود. پیشنهاد: برنامه مرور تاریخ.`
}

function parentMessage(): string {
  return `سلام. امیدواریم حال شما خوب باشد. درباره پیشرفت فرزندتان در کلاس، مشارکت خوب و نیاز به تمرین تاریخ را با شما در میان می‌گذاریم. لطفاً در صورت امکان مطالعه کوتاه شبانه را حمایت کنید.`
}

function storyTopicFromPrompt(prompt: string): string {
  return prompt.match(/موضوع داستان:\s*(?:\*+\s*)?([^\n*]+)/)?.[1]?.trim() || 'دوستی'
}

function studyQuestionFromPrompt(prompt: string): string {
  const afterQuestion = prompt.split('سؤال دانش‌آموز:')[1] ?? prompt
  return (
    afterQuestion
      .split('\n')
      .map((line) => line.trim())
      .find((line) => line.length > 0) ?? prompt
  )
}

/** فقط بخش تحت کنترل کاربر — قوانین ایمنی داخل پرامپت سیستم را دوباره به‌عنوان درخواست خشونت نخوان. */
function userControlledText(prompt: string, capability: EvalCapability): string {
  if (capability === 'story_wizard') return storyTopicFromPrompt(prompt)
  if (capability === 'study_buddy') return studyQuestionFromPrompt(prompt)
  if (capability === 'student_analyzer') {
    return prompt.split('دانش‌آموز:')[1]?.trim() ?? prompt
  }
  return prompt
}

/**
 * مدل مصنوعی قطعی برای ارزیابی کیفیت — بدون شبکه.
 * سیاست: رد محتوای نامناسب ۶–۱۸، نادیده گرفتن تزریق پرامپت، فارسی‌محور.
 */
export function mockHooshagarModel(prompt: string, capability: EvalCapability): string {
  const userText = userControlledText(prompt, capability)
  const unsafe = UNSAFE_REQUEST.test(userText)
  const injected = INJECTION_REQUEST.test(userText)

  if (unsafe) {
    return SAFETY_REFUSAL
  }

  if (injected && capability !== 'student_analyzer') {
    return INJECTION_REDIRECT
  }

  if (capability === 'student_analyzer') {
    return analyzeSaraFromPrompt(prompt)
  }

  if (capability === 'story_wizard') {
    return safeStory(storyTopicFromPrompt(prompt))
  }

  if (capability === 'study_buddy') {
    return studyBuddy(studyQuestionFromPrompt(prompt))
  }

  if (capability === 'content_creator') return lessonPlan()
  if (capability === 'homework_evaluator') return homeworkFeedback()
  if (capability === 'summarizer') {
    if (/ولی|والدین|پدر|مادر/.test(prompt)) return parentMessage()
    return summary()
  }

  return parentMessage()
}
