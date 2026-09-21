'use client'

import { StudentAiToolClient } from '@/components/student/student-ai-tool-client'
import { futureCompassSystemPrompt } from '@/lib/ai/elementary-prompts'

export default function FutureCompassPage() {
  return (
    <StudentAiToolClient
      featureName="future_compass"
      title="کشف علایق و استعداد"
      description="علایق و نقاط قوتت را بهتر بشناس و ایده‌های ساده برای رشدشان بگیر"
      placeholder="مثلاً: دوست دارم نقاشی و فوتبال؛ چه کارهایی پیشنهاد می‌دهی؟"
      quickPrompts={[
        'علاقه‌ام مشخص نیست',
        'دوست دارم کتاب بخوانم',
        'در ورزش خوبم',
      ]}
      buildPrompt={(text, grade) =>
        `${futureCompassSystemPrompt(grade)}\n\nپیام دانش‌آموز: ${text}`
      }
    />
  )
}
